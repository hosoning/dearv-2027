"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[618],{6109:function(e,t,r){r.d(t,{S:function(){return v}});var u=r(2265),n=r(9285);function v({pixelated:e}){let t=(0,n.D)(e=>e.gl),r=(0,n.D)(e=>e.internal.active),v=(0,n.D)(e=>e.performance.current),a=(0,n.D)(e=>e.viewport.initialDpr),i=(0,n.D)(e=>e.setDpr);return u.useEffect(()=>{let u=t.domElement;return()=>{r&&i(a),e&&u&&(u.style.imageRendering="auto")}},[]),u.useEffect(()=>{i(v*a),e&&t.domElement&&(t.domElement.style.imageRendering=1===v?"auto":"pixelated")},[v]),null}},1057:function(e,t,r){r.d(t,{j:function(){return o}});var u=r(1119),n=r(2265),v=r(2079),a=r(9285);let i={uniforms:{tDiffuse:{value:null},h:{value:1/512}},vertexShader:`
      varying vec2 vUv;

      void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float h;

    varying vec2 vUv;

    void main() {

    	vec4 sum = vec4( 0.0 );

    	sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;

    	gl_FragColor = sum;

    }
  `},s={uniforms:{tDiffuse:{value:null},v:{value:1/512}},vertexShader:`
    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,fragmentShader:`

  uniform sampler2D tDiffuse;
  uniform float v;

  varying vec2 vUv;

  void main() {

    vec4 sum = vec4( 0.0 );

    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;

    gl_FragColor = sum;

  }
  `},o=n.forwardRef(({scale:e=10,frames:t=1/0,opacity:r=1,width:o=1,height:f=1,blur:l=1,near:c=0,far:m=10,resolution:d=512,smooth:D=!0,color:x="#000000",depthWrite:h=!1,renderOrder:g,...p},U)=>{let y,b;let w=n.useRef(null),M=(0,a.D)(e=>e.scene),P=(0,a.D)(e=>e.gl),E=n.useRef(null);o*=Array.isArray(e)?e[0]:e||1,f*=Array.isArray(e)?e[1]:e||1;let[I,R,A,S,C,T,_]=n.useMemo(()=>{let e=new v.dd2(d,d),t=new v.dd2(d,d);t.texture.generateMipmaps=e.texture.generateMipmaps=!1;let r=new v._12(o,f).rotateX(Math.PI/2),u=new v.Kj0(r),n=new v.lRF;n.depthTest=n.depthWrite=!1,n.onBeforeCompile=e=>{e.uniforms={...e.uniforms,ucolor:{value:new v.Ilk(x)}},e.fragmentShader=e.fragmentShader.replace("void main() {",`uniform vec3 ucolor;
           void main() {
          `),e.fragmentShader=e.fragmentShader.replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );","vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );")};let a=new v.jyz(i),l=new v.jyz(s);return l.depthTest=a.depthTest=!1,[e,r,n,u,a,l,t]},[d,o,f,e,x]),k=e=>{S.visible=!0,S.material=C,C.uniforms.tDiffuse.value=I.texture,C.uniforms.h.value=1*e/256,P.setRenderTarget(_),P.render(S,E.current),S.material=T,T.uniforms.tDiffuse.value=_.texture,T.uniforms.v.value=1*e/256,P.setRenderTarget(I),P.render(S,E.current),S.visible=!1},j=0;return(0,a.F)(()=>{E.current&&(t===1/0||j<t)&&(j++,y=M.background,b=M.overrideMaterial,w.current.visible=!1,M.background=null,M.overrideMaterial=A,P.setRenderTarget(I),P.render(M,E.current),k(l),D&&k(.4*l),P.setRenderTarget(null),w.current.visible=!0,M.overrideMaterial=b,M.background=y)}),n.useImperativeHandle(U,()=>w.current,[]),n.createElement("group",(0,u.Z)({"rotation-x":Math.PI/2},p,{ref:w}),n.createElement("mesh",{renderOrder:g,geometry:R,scale:[1,-1,1],rotation:[-Math.PI/2,0,0]},n.createElement("meshBasicMaterial",{transparent:!0,map:I.texture,opacity:r,depthWrite:h})),n.createElement("orthographicCamera",{ref:E,args:[-o/2,o/2,f/2,-f/2,c,m]}))})},7094:function(e,t,r){r.d(t,{q:function(){return i}});var u=r(1448),n=r(2079),v=r(2265),a=r(9285);function i({all:e,scene:t,camera:r}){let i=(0,a.D)(({gl:e})=>e),s=(0,a.D)(({camera:e})=>e),o=(0,a.D)(({scene:e})=>e);return v.useLayoutEffect(()=>{let v=[];e&&(t||o).traverse(e=>{!1===e.visible&&(v.push(e),e.visible=!0)}),i.compile(t||o,r||s);let a=new u.WebGLCubeRenderTarget(128);new n._am(.01,1e5,a).update(i,t||o),a.dispose(),v.forEach(e=>e.visible=!1)},[]),null}},8146:function(e,t,r){r.d(t,{Z:function(){return a}});var u=r(1119),n=r(2265),v=r(2079);let a=n.forwardRef(function({args:[e=1,t=1,r=1]=[],radius:a=.05,steps:i=1,smoothness:s=4,bevelSegments:o=4,creaseAngle:f=.4,children:l,...c},m){let d=n.useMemo(()=>(function(e,t,r){let u=new v.bnF,n=r-1e-5;return u.absarc(1e-5,1e-5,1e-5,-Math.PI/2,-Math.PI,!0),u.absarc(1e-5,t-2*n,1e-5,Math.PI,Math.PI/2,!0),u.absarc(e-2*n,t-2*n,1e-5,Math.PI/2,0,!0),u.absarc(e-2*n,1e-5,1e-5,0,-Math.PI/2,!0),u})(e,t,a),[e,t,a]),D=n.useMemo(()=>({depth:r-2*a,bevelEnabled:!0,bevelSegments:2*o,steps:i,bevelSize:a-1e-5,bevelThickness:a,curveSegments:s}),[r,a,s]),x=n.useRef(null);return n.useLayoutEffect(()=>{x.current&&(x.current.center(),function(e,t=Math.PI/3){let r=Math.cos(t),u=(1+1e-10)*100,n=[new v.Pa4,new v.Pa4,new v.Pa4],a=new v.Pa4,i=new v.Pa4,s=new v.Pa4,o=new v.Pa4;function f(e){let t=~~(e.x*u),r=~~(e.y*u),n=~~(e.z*u);return`${t},${r},${n}`}let l=e.index?e.toNonIndexed():e,c=l.attributes.position,m={};for(let e=0,t=c.count/3;e<t;e++){let t=3*e,r=n[0].fromBufferAttribute(c,t+0),u=n[1].fromBufferAttribute(c,t+1),s=n[2].fromBufferAttribute(c,t+2);a.subVectors(s,u),i.subVectors(r,u);let o=new v.Pa4().crossVectors(a,i).normalize();for(let e=0;e<3;e++){let t=f(n[e]);t in m||(m[t]=[]),m[t].push(o)}}let d=new Float32Array(3*c.count),D=new v.TlE(d,3,!1);for(let e=0,t=c.count/3;e<t;e++){let t=3*e,u=n[0].fromBufferAttribute(c,t+0),v=n[1].fromBufferAttribute(c,t+1),l=n[2].fromBufferAttribute(c,t+2);a.subVectors(l,v),i.subVectors(u,v),s.crossVectors(a,i).normalize();for(let e=0;e<3;e++){let u=m[f(n[e])];o.set(0,0,0);for(let e=0,t=u.length;e<t;e++){let t=u[e];s.dot(t)>r&&o.add(t)}o.normalize(),D.setXYZ(t+e,o.x,o.y,o.z)}}l.setAttribute("normal",D)}(x.current,f))},[d,D]),n.createElement("mesh",(0,u.Z)({ref:m},c),n.createElement("extrudeGeometry",{ref:x,args:[d,D]}),l)})},1119:function(e,t,r){r.d(t,{Z:function(){return u}});function u(){return(u=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var u in r)({}).hasOwnProperty.call(r,u)&&(e[u]=r[u])}return e}).apply(null,arguments)}}}]);