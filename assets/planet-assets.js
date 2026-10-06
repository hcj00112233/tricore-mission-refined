/* Minimal, strict GLB 2.0 reader for our reproducible Blender export.
 * Reuses the application's Three instance. No second Three runtime or CDN.
 * Supports indexed triangle primitives, FLOAT attributes, embedded PNG/JPEG,
 * node TRS, PBR base-color/normal/roughness textures. Rejects unsupported data.
 * Node transforms are baked once into geometry, preserving authored silhouettes.
 */
export function createPlanetAssetLibrary(api) {
  const {BufferGeometry, Float32BufferAttribute, Vector3, Quaternion,
    TextureLoader, SRGBColorSpace, assetPath} = api;
  const cache = new Map();
  const metrics = {};
  async function read(name) {
    const started = performance.now();
    const response = await fetch(assetPath(`assets/models/${name}.glb`));
    if (!response.ok) throw new Error(`${name}.glb: HTTP ${response.status}`);
    const buffer = await response.arrayBuffer(), view = new DataView(buffer);
    if(view.getUint32(0,true)!==0x46546c67 || view.getUint32(4,true)!==2) throw new Error('Expected GLB 2.0');
    let json, binary;
    for(let offset=12;offset<buffer.byteLength;) {
      const length=view.getUint32(offset,true), type=view.getUint32(offset+4,true);
      if(type===0x4e4f534a) json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,offset+8,length)));
      if(type===0x004e4942) binary=buffer.slice(offset+8,offset+8+length);
      offset+=8+length;
    }
    if(!json || !binary || json.extensionsRequired?.length) throw new Error('Unsupported GLB extensions');
    const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
    const types={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
    function accessor(index) {
      const a=json.accessors[index], b=json.bufferViews[a.bufferView];
      if(a.sparse || b.byteStride || a.normalized || !types[a.componentType]) throw new Error('Unsupported accessor');
      return new types[a.componentType](binary,(b.byteOffset||0)+(a.byteOffset||0),a.count*components[a.type]);
    }
    const textureCache=new Map();
    function texture(index,color) {
      if(index===undefined) return Promise.resolve(null);
      const key=`${index}:${color}`;
      if(!textureCache.has(key)) textureCache.set(key,new Promise((resolve,reject)=>{
        const image=json.images[json.textures[index].source];
        const b=json.bufferViews[image.bufferView];
        const url=URL.createObjectURL(new Blob([new Uint8Array(binary,b.byteOffset||0,b.byteLength)],{type:image.mimeType}));
        new TextureLoader().load(url,t=>{t.flipY=false;if(color)t.colorSpace=SRGBColorSpace;t.anisotropy=4;URL.revokeObjectURL(url);resolve(t);},undefined,err=>{URL.revokeObjectURL(url);reject(err);});
      }));
      return textureCache.get(key);
    }
    const materials=await Promise.all((json.materials||[]).map(async m=>({
      name:m.name||'',color:m.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1],
      map:await texture(m.pbrMetallicRoughness?.baseColorTexture?.index,true),
      normal:await texture(m.normalTexture?.index,false),
      roughness:await texture(m.pbrMetallicRoughness?.metallicRoughnessTexture?.index,false)
    })));
    const meshes=[];
    function node(index,parents=[]) {
      const n=json.nodes[index];
      if(n.matrix)throw new Error('Matrix nodes must be exported as TRS');
      const transform={q:new Quaternion(...(n.rotation||[0,0,0,1])),s:n.scale||[1,1,1],t:n.translation||[0,0,0]};
      const chain=[transform,...parents];
      if(n.mesh!==undefined) for(const primitive of json.meshes[n.mesh].primitives) {
        if(primitive.mode!==undefined&&primitive.mode!==4)throw new Error('Expected triangle mesh');
        const geometry=new BufferGeometry();
        for(const [semantic,key,count] of [['POSITION','position',3],['NORMAL','normal',3],['TEXCOORD_0','uv',2]]) {
          if(primitive.attributes[semantic]===undefined)continue;
          const values=Float32Array.from(accessor(primitive.attributes[semantic]));
          if(count===3) for(let i=0;i<values.length;i+=3) {
            const v=new Vector3(values[i],values[i+1],values[i+2]);
            for(const c of chain) {
              if(key==='normal')v.set(v.x/c.s[0],v.y/c.s[1],v.z/c.s[2]).applyQuaternion(c.q);
              else v.set(v.x*c.s[0],v.y*c.s[1],v.z*c.s[2]).applyQuaternion(c.q).add(new Vector3(...c.t));
            }
            if(key==='normal')v.normalize();v.toArray(values,i);
          }
          geometry.setAttribute(key,new Float32BufferAttribute(values,count));
        }
        if(primitive.indices!==undefined)geometry.setIndex(Array.from(accessor(primitive.indices)));
        geometry.computeBoundingSphere(); geometry.computeBoundingBox();
        meshes.push({name:n.name||json.meshes[n.mesh].name,geometry,material:materials[primitive.material]});
      }
      for(const child of n.children||[])node(child,chain);
    }
    for(const root of json.scenes[json.scene||0].nodes)node(root);
    metrics[name]={bytes:buffer.byteLength,loadMs:Math.round(performance.now()-started),meshes:meshes.length,triangles:meshes.reduce((sum,m)=>sum+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0)};
    return {meshes,extras:json.nodes.find(n=>n.extras?.physical_shape_baked)?.extras};
  }
  return {metrics,load:name=>{if(!cache.has(name))cache.set(name,read(name));return cache.get(name);}};
}
