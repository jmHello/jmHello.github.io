---
layout: post
title: "javasript - 跨域 - location.hash + iframe"
data: 2017-09-13 10:27:00 +0800
categories: 原创
tag: javascript
---
* content
{:toc}

* 其他连接：
    + [javasript - 同源策略]({{ '/2017/09/07/js-Same-Origin-Policy' | prepend: site.baseurl }})
    + [javasript - 跨域 - CORS]({{ '/2017/09/07/js-CORS' | prepend: site.baseurl }})
    + [javasript - 跨域 - JSONP]({{ '/2017/09/07/js-JSONP' | prepend: site.baseurl }})
    + [javasript - 跨域 - Iframe和window.name]({{ '/2017/09/09/js-window-name-iframe' | prepend: site.baseurl }})
    + [javasript - 跨域 - document.domain和iframe]({{ '/2017/09/11/js-document-domain' | prepend: site.baseurl }})
    + [javasript - 跨域 - 动态创建script标签]({{ '/2017/09/11/js-script' | prepend: site.baseurl }})
  
* 以下内容部分都摘自书本：《JavaScript高级程序设计（第3版）》 13.4.7 HTML5 事件

<!-- more -->

## 一、location.hash与iframe实现跨域

![relationship-map]({{'/styles/images/javascript/crossDomain/crossDomain-06.png' | prepend: site.baseurl}})

### 1.1 原理

> * `iframe` + `hash` 实现跨域。

### 1.2 步骤

> * 假设`http://127.0.0.1:3001/a.html`与`http://127.0.0.1:3002/b.html`需要实现通信。

> * **`http://127.0.0.1:3001/a.html`**

> 1. `http://127.0.0.1:3001/a.html`下嵌入一个`iframe`，其`src`为：`http://127.0.0.1:3002/b.html`
> 2. `a.html`发送数据数据给`b.html`，并修改`iframe`的`src`为`http://127.0.0.1:3002/b.html#pro`【`#pro`就是`location.hash`】
> 3. `a.html`在监听到`url`变化，并进行相应的操作
>     * 即：`a.html`通过`url`的`hash`就可以拿到`b.html`传过来的数据


> **`http://127.0.0.1:3002/b.html`**

> 1. `b.html`监听到`url`的变化，触发相应的操作
>     * `b.html`传送数据到`a.html`，由于两个页面不在同一个域下`IE`、`Chrome`不允许修改`parent.location.hash`的值，所以要借助于父窗口域名下的一个代理`iframe`
> 2. `b.html`下创建一个**隐藏**的`iframe`，其`src`为：`http://127.0.0.1:3001/proxy.html`，并附加上要传送的数据，即`iframe`完整的`src`是：`http://127.0.0.1:3001/proxy.html#data`

```js
try {  
    parent.location.hash = 'data';  
} catch (e) {  
    // ie、chrome的安全机制无法修改parent.location.hash， 
     // 创建一个iframe
    var ifrproxy = document.createElement('iframe');
     // 隐藏iframe
    ifrproxy.style.display = 'none';  
    ifrproxy.src = "http://www.baidu.com/proxy.html#data";  
    // 将iframe添加到页面，资源才可以加载
    document.body.appendChild(ifrproxy);  
}
```

> **`http://127.0.0.1:3001/proxy.html`**

> 1. `proxy.html`监听到`url`的变化，就可以修改**与其同域**的`a.html`的`url`。

```js
//因为parent.parent（即http://127.0.0.1:3001/a.html）和http://127.0.0.1:3001/proxy.html属于同一个域，所以可以改变其location.hash的值  
parent.parent.location.hash = self.location.hash.substring(1);
```

### 1.3 location.hash的注意事项

> * `HTTP`请求过程中不会携带`hash`，所以修改`hash`不会产生`HTTP`请求
> * 设置 `location.hash` 会在这些浏览器中生成一条新的历史记录

## 二、hashchange事件

> * `hashchange`事件：在 URL 的参数列表（及 `URL` 中“`#`”号后面的所有字符串）发生变化时通知开发人员。
>     * 新增这个事件的原因：在 `Ajax` 应用中，开发人员经常要利用 `URL` 参数列表来保存状态或导航信息。
>     * 支持 `hashchange` 事件的浏览器有 IE8+、Firefox 3.6+、Safari 5+、Chrome 和 Opera 10.6+。
>         * 只有 Firefox 6+、Chrome 和 Opera 支持 `oldURL` 和 `newURL` 属性。
        
> *  `hashchange` 事件处理程序只能挂在 `window`对象下，然后 `URL` 参数列表只要变化就会调用它。
>     *  `event` 对象应该额外包含两个属性：
>         * `oldURL`：保存着参数列表变化前的完整 `URL`  。
>         * `newURL`：存着参数列表变化后的完整 `URL`。

```js
EventUtil.addHandler(window, "hashchange", function(event){
 alert("Old URL: " + event.oldURL + "\nNew URL: " + event.newURL);
})
 
//最好是使用 location对象来确定当前的参数列表。
EventUtil.addHandler(window, "hashchange", function(event){
 alert("Current hash: " + location.hash);
}); 
```

> * 检测浏览器是否支持 `hashchange` 事件

```js
var isSupported = ("onhashchange" in window); //这里有 bug 

// 如果 IE8 是在 IE7 文档模式下运行，即使功能无效它也会返回 true。
var isSupported = ("onhashchange" in window) && (document.documentMode === undefined || document.documentMode > 7); 

```

## 三、总结

> * `location.hash`和`iframe`跨域存在的问题：
>   1. 这个方式的通信会造成一些不必要的浏览器历史记录
>   2. 有些浏览器不支持`onhashchange`事件，需要轮询来获知U`RL`的改变
>   3. 数据直接暴露在了`url`中
>   4. 数据容量和类型都有限