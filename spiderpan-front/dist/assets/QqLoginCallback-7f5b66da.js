import{u as t,b as c}from"./vue-router-3dc4a115.js";import{j as n,o as s,c as u}from"./@vue-7298a6f3.js";const f={__name:"QqLoginCallback",setup(i){const{proxy:r}=n(),o=t();c();const l={logincallback:"/qqlogin/callback"};return(async()=>{let a=await r.Request({url:l.logincallback,params:o.currentRoute.value.query,errorCallback:()=>{o.push("/")}});if(!a)return;let e=a.data.callbackUrl||"/";e=="/login"&&(e="/"),r.VueCookies.set("userInfo",a.data.userInfo,0),console.log("路径",e),o.push(e)})(),(a,e)=>(s(),u("div",null,"登录中，请勿刷新页面"))}};export{f as default};
