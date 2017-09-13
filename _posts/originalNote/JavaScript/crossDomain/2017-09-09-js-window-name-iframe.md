---
layout: post
title: "javasript -跨域 - Iframe和window.name"
data: 2017-09-09 22:27:00 +0800
categories: 原创
tag: javascript
---
* content
{:toc}

* 其他连接：
    + [javasript - 同源策略]({{ '/2017/09/07/js-Same-Origin-Policy' | prepend: site.baseurl }})
    + [javasript - 跨域 - CORS]({{ '/2017/09/07/js-CORS' | prepend: site.baseurl }})
    + [javasript - 跨域 - JSONP]({{ '/2017/09/07/js-JSONP' | prepend: site.baseurl }})
    + [javasript - 跨域 - document.domain和iframe]({{ '/2017/09/11/js-document-domain' | prepend: site.baseurl }})
    + [javasript - 跨域 - 动态创建script标签]({{ '/2017/09/11/js-script' | prepend: site.baseurl }})
    + [javasript - 跨域 - location.hash + iframe]({{ '/2017/09/13/js-hash' | prepend: site.baseurl }})

* 参考文献：
    * [http://www.cnblogs.com/inJS/p/6129945.html](http://www.cnblogs.com/inJS/p/6129945.html)
    
<!-- more -->

## 一、iframe

### 1.1 什么是iframe

* 在`HTML`中有三种结构特征：树结构、层次结构、框结构。`iframe`正是框结构中的一员。
* `iframe` 元素会创建包含另外一个文档的内联框架（即行内框架）。
* **简单地说，我们可以通过`ifram`在自己的网页展示其他的网页。**

> 可以把需要的文本放置在 `<iframe>` 和 `</iframe>` 之间，这样就可以应对无法理解 `iframe` 的浏览器。

* `iframe`的属性，如下图：

![relationship-map]({{'/styles/images/javascript/crossDomain/crossDomain-04.png' | prepend: site.baseurl}})

## 二、window.name的传输技术

先看一下以下js代码（假设当前的网址为：`http://www.jmazm.com/`）：

```js
// 1. 设置window.name
window.name = 'jmazm';
// 2. 读取window.name
console.log(window.name); // 'jmazm'
// 3. 跳转页面
location.href = 'http://www.cnblogs.com/Jm-jing/';
// 4. 再次读取window.name
console.log(window.name); // 'jmazm'
```

* 也尝试过刷新页面以及强制刷新页面，读取的`window.name`的值依然为`jmazm`。

* 总结：只要设置了`window.name`，它的值永远不变，无论是刷新或者跳转页面，除非你手动更改页面

## 三、iframe和window.name的结合跨域

* 简略过程如下图

![relationship-map]({{'/styles/images/javascript/crossDomain/crossDomain-05.png' | prepend: site.baseurl}})

最简单的`iframe`和`window.name`的结合跨域的操作我们需要的“工具”如下：
    
1. 两个不同的域（可随意搭建，这里只是举个例子）：`http://127.0.0.1:3001`、`http://127.0.0.1:3002`
2. `http://127.0.0.1:3001`下需要两个页面：`a.html`、`c.html`
3. `http://127.0.0.1:3002`下需要一个页面：`b.html`

接下来再讲讲具体的步骤以及举个例子：

* **`http://127.0.0.1:3001/a.html`**：
    * 有一个目标：`a.html`需要获取`http://127.0.0.1:3002/b.html`的数据，但是存在一个严重的问题：它俩由于端口号不同导致不同域，因此无法跨域获取数据。
        * 解决问题的方法：使用`iframe`，将`http://127.0.0.1:3002/b.html`页面嵌入
    * 可以额外添加一些函数，用来给与它同域的页面调用，例如：update()

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>获取数据</title>
</head>
<body>
  <div>正在获取数据……</div>
  
  <iframe src="http://127.0.0.1:3002/b.html" frameborder="0"></iframe> 
  
  <script>
  function update(data) {
       data = JSON.parse(data);
    
       var html = ['<ul>'];
       
       // es6
       data.forEach((item) => {
         html.push(`<li>${item.name} love ${item.love}</li>`);
       });
       
       // es5
       //data.forEach(function(item) {
       //  html.push('<li>'+ item.name + 'love' + item.love +'</li>')
       //})
       
       html.push('</ul>');
    
       document.querySelector('div').innerHTML = html.join('');
   }
  </script>
</body>
</html>
```

* **`http://127.0.0.1:3002/b.html`**：
    * 用途：生产数据。
    * 过程：生产数据成功后，将返回的数据复制给`window.name`，并使用`location.name`跳转到`http://127.0.0.1:3001/c.html`
        * 由于`window.name`强大存储数据的能力，让`c.html`成功跨域拿到了`b.html`的数据
    
```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>处理数据</title>
</head>

<body>
  <script>
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        // 赋值给window.name
        window.name = xhr.responseText;
        // 跳转到'http://127.0.0.1:3001/c.html
        location.href = 'http://127.0.0.1:3001/c.html';
      } else {
        console.log(xhr.status, xhr.statusText);
      }
    }

    xhr.open('get', 'data.json');
    xhr.send(null);

  </script>
</body>
</html>
```

* **`http://127.0.0.1:3001/c.html`**：
    * 由于`a.html`和`c.html`同域，所以`a.html`可以调用`c.html`的数据，同时`c.html`的数据可以发送给`a.html`。因此，在`c.html`可调用其父页面的函数，并传进`window.name`，如：`parent.update(window.name)`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>传递数据</title>
</head>
<body>
  <script>
    parent.update(window.name);
  </script>
</body>
</html>

```