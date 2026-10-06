"""TRICORE authored planet library. Blender 4.5+; no third-party packages.
Run: blender --background --python blender/generate_planets.py -- --output assets/models
Each .blend contains a tilted editable rig; GLB is exported upright with baked
oblateness. The website restores the documented tilt and custom solar materials.
"""
import bpy, math, json, sys, argparse
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument('--output', default=str(ROOT/'assets/models'))
OPT = parser.parse_args(args)
OUT = Path(OPT.output).resolve()
OUT.mkdir(parents=True, exist_ok=True)
TEX = OUT/'textures'; TEX.mkdir(exist_ok=True)
CONFIG = [
    ('Mercury','mercury',1.0,.034,'2k_mercury.jpg',.90),
    ('Venus','forge',1.0,177.36,'2k_venus_atmosphere.jpg',.96),
    ('Mars','recon',3376.2/3396.2,25.19,'2k_mars.jpg',.88),
    ('Jupiter','warden',66854/71492,3.13,'2k_jupiter.jpg',.98),
    ('Saturn','saturn',54364/60268,26.73,'2k_saturn.jpg',.98),
    ('Uranus','uranus',24973/25559,97.77,'2k_uranus.jpg',.98),
    ('Neptune','neptune',24341/24764,28.32,'2k_neptune.jpg',.98),
]
def save_image(name, rgb, alpha=None):
    h,w = rgb.shape[:2]
    im = bpy.data.images.new(name, w, h, alpha=alpha is not None)
    rgba = np.ones((h,w,4),dtype=np.float32); rgba[:,:,:3]=rgb
    if alpha is not None: rgba[:,:,3]=alpha
    im.pixels.foreach_set(rgba.ravel())
    im.filepath_raw=str(TEX/(name+'.png')); im.file_format='PNG'; im.save()
    return im

def source_pixels(file):
    im=bpy.data.images.load(str(ROOT/'assets/planets'/file))
    im.scale(1024,512)
    pixels=np.empty(1024*512*4,dtype=np.float32); im.pixels.foreach_get(pixels)
    return pixels.reshape(512,1024,4)[:,:,:3].copy()

def author_maps(name, file):
    rgb=source_pixels(file)
    h,w=rgb.shape[:2]
    v,u=np.mgrid[0:h,0:w]; u=u/w; v=v/h
    lon=u*2*math.pi; lat=(v-.5)*math.pi
    lum=rgb@np.array([.2126,.7152,.0722])
    if name=='Mercury': rgb=np.repeat((lum*.92+.025)[:,:,None],3,axis=2)
    if name=='Venus':
        # Visible cloud deck is completely opaque. UV imagery is not visible color.
        clouds=(lum-lum.mean())*.25
        rgb=np.stack([.84+clouds,.80+clouds,.66+clouds*.8],axis=-1)
    if name=='Uranus':
        detail=(lum-lum.mean())*.065+.005*np.sin(lat*25+np.sin(lon*4))
        rgb=np.stack([.55+detail,.76+detail,.79+detail],axis=-1)
    if name=='Neptune':
        # Recolored illustrative SSS map; restrained cyan, not enhanced Voyager blue.
        detail=(lum-lum.mean())*.22
        rgb=np.stack([.38+detail*.85,.63+detail,.69+detail],axis=-1)
    color=save_image(name.lower()+'_albedo',np.clip(rgb,0,1))
    normal=None; rough=None
    if name in ('Mercury','Mars'):
        # Procedurally authored microrelief, not an elevation measurement.
        height=.000015*(np.sin(lon*181+np.sin(lat*67))*np.cos(lat*131))
        if name=='Mercury':
            rng=np.random.default_rng(19274)
            for i in range(74):
                x=rng.uniform(0,2*math.pi); y=rng.uniform(-1.35,1.35)
                width=rng.uniform(.006,.035)
                dlon=np.arctan2(np.sin(lon-x),np.cos(lon-x))*np.cos(y)
                radius=np.sqrt(dlon**2+(lat-y)**2)/width
                height+=.000045*np.exp(-((radius-1.05)/.22)**2)-.00006*np.exp(-radius**4)
        else:
            height+=.00001*np.sin(lon*97)*np.cos(lat*61)
        # Tangent-space normal baked analytically from the authored height field.
        du=(np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))*w/(2*math.pi*.5*np.maximum(np.cos(lat),.15))
        dv=(np.roll(height,-1,axis=0)-np.roll(height,1,axis=0))*h/(math.pi*.5)
        n=np.stack([-du,-dv,np.ones_like(du)],axis=-1)
        n/=np.linalg.norm(n,axis=-1)[:,:,None]
        normal=save_image(name.lower()+'_normal',n*.5+.5)
        normal.colorspace_settings.name='Non-Color'
        rough=save_image(name.lower()+'_roughness',np.repeat(np.clip(.78+lum*.18,0,1)[:,:,None],3,axis=2))
        rough.colorspace_settings.name='Non-Color'
    return color,normal,rough

def pbr(name, color, normal, rough, roughness):
    mat=bpy.data.materials.new(name+'_PBR'); mat.use_nodes=True
    nodes=mat.node_tree.nodes; links=mat.node_tree.links
    bsdf=nodes.get('Principled BSDF'); bsdf.inputs['Roughness'].default_value=roughness
    bsdf.inputs['Metallic'].default_value=0
    tex=nodes.new('ShaderNodeTexImage'); tex.image=color; tex.label='Authored albedo / source attribution in SOURCES.md'
    links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
    if normal:
        t=nodes.new('ShaderNodeTexImage'); t.image=normal
        n=nodes.new('ShaderNodeNormalMap'); links.new(t.outputs['Color'],n.inputs['Color']); links.new(n.outputs['Normal'],bsdf.inputs['Normal'])
    if rough:
        t=nodes.new('ShaderNodeTexImage'); t.image=rough; links.new(t.outputs['Color'],bsdf.inputs['Roughness'])
    return mat

def sphere(name, ratio, material, parent, radius=.5, relief=False):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=128,ring_count=64,radius=radius)
    ob=bpy.context.object; ob.name=name; ob.data.name=name+'_Geometry'
    # Physical flattening is baked into vertices, never a runtime scale animation.
    for vert in ob.data.vertices:
        z=vert.co.z/radius
        lon=math.atan2(vert.co.y,vert.co.x); lat=math.asin(max(-1,min(1,z)))
        displacement=0
        if relief and name.startswith('Mercury'):
            # Caloris-like broad impact basin: restrained 0.00012 radius units.
            d=((math.atan2(math.sin(lon-2.8),math.cos(lon-2.8))*math.cos(.53))**2+(lat-.53)**2)**.5
            displacement=-.00012*math.exp(-(d/.18)**4)+.00008*math.exp(-((d-.19)/.035)**2)
        if relief and name.startswith('Mars'):
            # Olympus-like shield relief, approx 21 km / 3396 km; gradual silhouette.
            d=(math.atan2(math.sin(lon-3.947),math.cos(lon-3.947))**2+(lat-.326)**2)**.5
            displacement=.0031*math.exp(-(d/.052)**2)
        vert.co*=1+displacement/radius
        vert.co.z*=ratio
    ob.data.update()
    for p in ob.data.polygons: p.use_smooth=True
    ob.data.materials.append(material); ob.parent=parent
    ob['polar_equatorial_ratio']=ratio
    return ob

def ring(name, inner, outer, parent, texture, color=(.65,.59,.48), faint=False):
    vertices=[]; faces=[]; uv=[]; count=256
    for i in range(count+1):
        a=i/count*math.tau
        for radius in (inner,outer):
            vertices.append((radius*math.cos(a),radius*math.sin(a),0))
            uv.append(((radius-.555)/(.5*2.269-.555),.5))
    for i in range(count):
        a=i*2; faces.append((a,a+1,a+3,a+2))
    mesh=bpy.data.meshes.new(name+'_Geometry'); mesh.from_pydata(vertices,[],faces); mesh.update()
    ob=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(ob); ob.parent=parent
    layer=mesh.uv_layers.new(name='RadialUV')
    for face in mesh.polygons:
        for li in face.loop_indices: layer.data[li].uv=uv[mesh.loops[li].vertex_index]
    mat=bpy.data.materials.new(name+'_PBR'); mat.use_nodes=True; mat.diffuse_color=(*color,.18 if faint else 1)
    bsdf=mat.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Base Color'].default_value=(*color,1)
    bsdf.inputs['Roughness'].default_value=1
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=texture
    if not faint:
        mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
        mat.node_tree.links.new(tex.outputs['Alpha'],bsdf.inputs['Alpha'])
    else: bsdf.inputs['Alpha'].default_value=.18
    mat.surface_render_method='DITHERED'; mat.use_backface_culling=False
    ob.data.materials.append(mat); ob['ring_inner_equatorial_radii']=inner/.5; ob['ring_outer_equatorial_radii']=outer/.5
    return ob

library=[]
for name,agent,ratio,tilt,file,roughness in CONFIG:
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_recursive=True)
    bpy.context.scene.world.color=(.006,.009,.014)
    root=bpy.data.objects.new(name+'_AxialRig',None); bpy.context.collection.objects.link(root)
    root['agent_id']=agent; root['axial_tilt_degrees']=tilt
    root['display_radius']=.5; root['physical_shape_baked']=True
    root['relief_note']='Illustrative restrained relief, not a measured DEM'
    color,normal,rough=author_maps(name,file)
    material=pbr(name,color,normal,rough,roughness)
    globe=sphere(name+('_OpaqueCloudDeck' if name=='Venus' else '_Globe'),ratio,material,root,relief=name in ('Mercury','Mars'))
    if name!='Mercury':
        atm=bpy.data.materials.new(name+'_Atmosphere'); atm.use_nodes=True
        p=atm.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(.6,.72,.78,1); p.inputs['Alpha'].default_value=.025
        atm.surface_render_method='DITHERED'; atm.diffuse_color=(.6,.72,.78,.025)
        sphere(name+'_AtmosphericLimb',ratio,atm,root,radius=.5035)
    if name=='Venus':
        ground=bpy.data.materials.new('Venus_HiddenGround'); ground.diffuse_color=(.24,.20,.14,1)
        sphere('Venus_HiddenGround',1,ground,root,radius=.496)
    if name=='Saturn':
        texture=bpy.data.images.load(str(ROOT/'assets/planets/2k_saturn_ring_alpha.png'))
        # Geometry excludes Cassini, Encke and Keeler gaps. Very thin equatorial planes.
        bands=[('D',1.110,1.239),('C',1.239,1.526),('B',1.526,1.951),('A_inner',2.026,2.217),('A_middle',2.222,2.264),('A_outer',2.266,2.269),('F',2.322,2.328)]
        for label,a,b in bands: ring('Saturn_Ring_'+label,a*.5,b*.5,root,texture)
    if name=='Uranus':
        texture=color
        for label,a,b in [('Epsilon',1.987,1.997),('Delta',1.895,1.900),('Gamma',1.865,1.870)]:
            ring('Uranus_Ring_'+label,a*.5,b*.5,root,texture,(.22,.26,.26),True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active=globe
    glb=OUT/(name.lower()+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_animations=False,export_texcoords=True,export_normals=True,export_tangents=False,export_image_format='AUTO')
    # Editable .blend has proper axial orientation plus solar studio setup.
    root.rotation_euler.y=-math.radians(tilt)
    for image in bpy.data.images:
        if image.source=='FILE' and image.filepath: image.pack()
    bpy.ops.object.light_add(type='SUN',location=(-3,-4,5)); key=bpy.context.object; key.name='Solar_Key'; key.data.energy=2.0; key.rotation_euler=(.6,-.55,-.5); key.data.angle=.0093
    bpy.ops.object.light_add(type='AREA',location=(2,-3,1)); fill=bpy.context.object; fill.name='Restrained_Fill'; fill.data.energy=12; fill.data.size=5
    bpy.ops.object.camera_add(location=(0,-4.3,1.0)); cam=bpy.context.object; cam.name=name+'_ReviewCamera'; cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler(); cam.data.lens=58
    scene=bpy.context.scene; scene.camera=cam; scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=960; scene.render.resolution_y=960; scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'; scene.render.filepath=str(OUT/(name.lower()+'_preview.png'))
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(name.lower()+'.blend')))
    library.append(dict(name=name,agent=agent,polar_equatorial_ratio=ratio,axial_tilt_degrees=tilt,glb=name.lower()+'.glb',bytes=glb.stat().st_size,vertices=sum(len(ob.data.vertices) for ob in bpy.context.scene.objects if ob.type=='MESH'),triangles=sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in bpy.context.scene.objects if ob.type=='MESH')))
(OUT/'manifest.json').write_text(json.dumps(dict(generator='blender/generate_planets.py',blender=bpy.app.version_string,models=library,units='equatorial radius 0.5; display scales and orbits intentionally nonphysical',materials='PBR export; web shaders reproduce solar shading, normal maps, atmospheric limb and mutual ring shadows'),indent=2))
print('TRICORE_LIBRARY_COMPLETE',json.dumps(library))
