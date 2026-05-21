import{G as e,l as t}from"./index.DD8a6ndr.js";const l=s=>e("/api/v1/blog/posts",{params:s}),a=s=>e(`/api/v1/blog/posts/${s}`),r=(s=0,o=12)=>t({queryKey:["blog","list",s,o],queryFn:()=>l({skip:s,limit:o}),staleTime:5*6e4}),u=s=>t({queryKey:["blog","post",s],queryFn:()=>a(s),staleTime:5*6e4});export{u as a,r as u};
//# sourceMappingURL=useBlog.CIWhzETr.js.map
