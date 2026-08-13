"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[61],{1057:function(e,t,r){r.d(t,{j:function(){return o}});var u=r(1119),v=r(2265),n=r(2079),a=r(9285);let i={uniforms:{tDiffuse:{value:null},h:{value:1/512}},vertexShader:`
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
  `},o=v.forwardRef(({scale:e=10,frames:t=1/0,opacity:r=1,width:o=1,height:f=1,blur:l=1,near:c=0,far:m=10,resolution:d=512,smooth:x=!0,color:h="#000000",depthWrite:D=!1,renderOrder:U,...g},y)=>{let b,p;let w=v.useRef(null),M=(0,a.D)(e=>e.scene),P=(0,a.D)(e=>e.gl),I=v.useRef(null);o*=Array.isArray(e)?e[0]:e||1,f*=Array.isArray(e)?e[1]:e||1;let[A,E,S,R,k,C,T]=v.useMemo(()=>{let e=new n.dd2(d,d),t=new n.dd2(d,d);t.texture.generateMipmaps=e.texture.generateMipmaps=!1;let r=new n._12(o,f).rotateX(Math.PI/2),u=new n.Kj0(r),v=new n.lRF;v.depthTest=v.depthWrite=!1,v.onBeforeCompile=e=>{e.uniforms={...e.uniforms,ucolor:{value:new n.Ilk(h)}},e.fragmentShader=e.fragmentShader.replace("void main() {",`uniform vec3 ucolor;
           void main() {
          `),e.fragmentShader=e.fragmentShader.replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );","vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );")};let a=new n.jyz(i),l=new n.jyz(s);return l.depthTest=a.depthTest=!1,[e,r,v,u,a,l,t]},[d,o,f,e,h]),_=e=>{R.visible=!0,R.material=k,k.uniforms.tDiffuse.value=A.texture,k.uniforms.h.value=1*e/256,P.setRenderTarget(T),P.render(R,I.current),R.material=C,C.uniforms.tDiffuse.value=T.texture,C.uniforms.v.value=1*e/256,P.setRenderTarget(A),P.render(R,I.current),R.visible=!1},j=0;return(0,a.F)(()=>{I.current&&(t===1/0||j<t)&&(j++,b=M.background,p=M.overrideMaterial,w.current.visible=!1,M.background=null,M.overrideMaterial=S,P.setRenderTarget(A),P.render(M,I.current),_(l),x&&_(.4*l),P.setRenderTarget(null),w.current.visible=!0,M.overrideMaterial=p,M.background=b)}),v.useImperativeHandle(y,()=>w.current,[]),v.createElement("group",(0,u.Z)({"rotation-x":Math.PI/2},g,{ref:w}),v.createElement("mesh",{renderOrder:U,geometry:E,scale:[1,-1,1],rotation:[-Math.PI/2,0,0]},v.createElement("meshBasicMaterial",{transparent:!0,map:A.texture,opacity:r,depthWrite:D})),v.createElement("orthographicCamera",{ref:I,args:[-o/2,o/2,f/2,-f/2,c,m]}))})},8146:function(e,t,r){r.d(t,{Z:function(){return a}});var u=r(1119),v=r(2265),n=r(2079);let a=v.forwardRef(function({args:[e=1,t=1,r=1]=[],radius:a=.05,steps:i=1,smoothness:s=4,bevelSegments:o=4,creaseAngle:f=.4,children:l,...c},m){let d=v.useMemo(()=>(function(e,t,r){let u=new n.bnF,v=r-1e-5;return u.absarc(1e-5,1e-5,1e-5,-Math.PI/2,-Math.PI,!0),u.absarc(1e-5,t-2*v,1e-5,Math.PI,Math.PI/2,!0),u.absarc(e-2*v,t-2*v,1e-5,Math.PI/2,0,!0),u.absarc(e-2*v,1e-5,1e-5,0,-Math.PI/2,!0),u})(e,t,a),[e,t,a]),x=v.useMemo(()=>({depth:r-2*a,bevelEnabled:!0,bevelSegments:2*o,steps:i,bevelSize:a-1e-5,bevelThickness:a,curveSegments:s}),[r,a,s]),h=v.useRef(null);return v.useLayoutEffect(()=>{h.current&&(h.current.center(),function(e,t=Math.PI/3){let r=Math.cos(t),u=(1+1e-10)*100,v=[new n.Pa4,new n.Pa4,new n.Pa4],a=new n.Pa4,i=new n.Pa4,s=new n.Pa4,o=new n.Pa4;function f(e){let t=~~(e.x*u),r=~~(e.y*u),v=~~(e.z*u);return`${t},${r},${v}`}let l=e.index?e.toNonIndexed():e,c=l.attributes.position,m={};for(let e=0,t=c.count/3;e<t;e++){let t=3*e,r=v[0].fromBufferAttribute(c,t+0),u=v[1].fromBufferAttribute(c,t+1),s=v[2].fromBufferAttribute(c,t+2);a.subVectors(s,u),i.subVectors(r,u);let o=new n.Pa4().crossVectors(a,i).normalize();for(let e=0;e<3;e++){let t=f(v[e]);t in m||(m[t]=[]),m[t].push(o)}}let d=new Float32Array(3*c.count),x=new n.TlE(d,3,!1);for(let e=0,t=c.count/3;e<t;e++){let t=3*e,u=v[0].fromBufferAttribute(c,t+0),n=v[1].fromBufferAttribute(c,t+1),l=v[2].fromBufferAttribute(c,t+2);a.subVectors(l,n),i.subVectors(u,n),s.crossVectors(a,i).normalize();for(let e=0;e<3;e++){let u=m[f(v[e])];o.set(0,0,0);for(let e=0,t=u.length;e<t;e++){let t=u[e];s.dot(t)>r&&o.add(t)}o.normalize(),x.setXYZ(t+e,o.x,o.y,o.z)}}l.setAttribute("normal",x)}(h.current,f))},[d,x]),v.createElement("mesh",(0,u.Z)({ref:m},c),v.createElement("extrudeGeometry",{ref:h,args:[d,x]}),l)})},1119:function(e,t,r){r.d(t,{Z:function(){return u}});function u(){return(u=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var u in r)({}).hasOwnProperty.call(r,u)&&(e[u]=r[u])}return e}).apply(null,arguments)}}}]);