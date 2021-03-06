---
layout: post
title: "jQuery - 代码分析之jquery变量"
date: 2017-09-06 19:00:00 +0800 
categories: 原创
tag: jQuery
---
* content
{:toc}

其他链接：

+ 中文官方主页： [http://jekyll.com.cn/](http://jekyll.com.cn/)

<!-- more -->

## 一、变量 jQuery

### 1.1 介绍

> * 一般面向对象的写法是这样的：

```js
var jQuery = function() {
  //...
};
jQuery.prototype.init = function() {
  //...
}
jQuery.prototype.css = function() {
  //...
}

// 调用
var jq = new jQuery();
jq.init();
jq.css();
```

> * 到了jq这里就不一样了，是**链式调用**

```js
var jQuery = function() {
   return new jQuery.fn.init();
};
jQuery.fn = jQuery.prototype = {
    init: function() {
      
    },
    css: function() {
      
    }
}
// 使用jQuery的原型对象覆盖init的原型对象
jQuery.fn.init.prototype = jQuery.fn;

//调用
jQuery().css();
```


## 二、 疑问

### 2.1  为什么要`jQuery.fn = jQuery.prototype`,而不是`fn = jQuery.prototype`?

> * 首先，其实是由于`jQuery.prototype`太长了，我们只是换一个比较名字而已，他们两个是一样的。
> * 接着，将`jQuery.prototype`挂在`jQuery`对象的的`fn`属性下，是为了安全着想，不然任何人都可以随意改了。

### 2.2 为什么要在`jQuery`的构造函数里返回` return new jQuery.fn.init();`？

> * 由于需要起到“链式”调用的作用，那么`jQuery`的构造函数返回的必然是一个对象才可以，因此，一开始我们的想法是：
> * 点击打开[demo](/effects/demo/jq/$/v1.html)

```js
// Uncaught RangeError: Maximum call stack size exceeded
// 报错的原因是：jQuery在不停地自己调用自己，没有限制
var $ = jQuery = function () {
  return new jQuery()
}
console.log($())
```

> * 从上述代码的输出结果，你可以发现报错了：` Maximum call stack size exceeded`，即：内存外溢，出现了死循环引用

---

```js
 var $jq = new jQuery();
```

> * 看到上述代码，尽管真实的`jq`我们是不会这样去操作的，但是这也提示了我们，为什么要`new`一个实例出来：
>   * 让`$jq` 实例对象就有`jQuery.prototype`包含的原型属性和方法。
>   * 确定`this`的指向：`this`也会指向`$jq`的实例对象。

--- 

> * 既然自己调用自己不行，那么我就借助别人，然后再转化成自己的！
> * 我们就可以尝试用工厂方法来创建一个实例，并且将这个方法放在`jQuery.prototype`原型对象上，并在`jQuery`函数中返回这个原型方法的调用。
> * 点击打开[demo](/effects/demo/jq/$/v2.html)

```js
    const $ = jQuery = function () {
      return jQuery.fn.init()
    }
    jQuery.fn = jQuery.prototype = {
      init: function () {
        this.length =   0
        this.test = function () {
          return this.length
        }
        return this
      },
      jquery: '1.3.2',
      length: 1,
      size: function () {
        return this.length
      }
    }
    console.log($().jquery) // 1.3.2
    console.log($().test()) // 0
    console.log($().size()) // 0
```
> * 上面的代码貌似可以实现我们的链式调用了，然而，它还是存在问题的：` return jQuery.fn.init();`这一句话其实破环了**作用域的独立性**。

> * **可以试想一下：`init()`方法中的`this`究竟指代的是`jQuery`呢还是`init()`方法本身呢？** 

> * 分析上述代码：`this`关键字引用了`init()`函数作用域所在的对象，所以`$().test()`返回0。
> * 但是，`this`关键字又可以访问上一级对象`jQuery.fn`的作用域，所以`$().version`返回`'2.0.3'`。
> * 记得，`$().size()`返回的是0。**很明显，这样的设计很糟糕！！因此我们需要分隔作用域**
  
> * 点击打开[demo](/effects/demo/jq/$/v3.html)
  
```js
    var $ = jQuery = function() {
        // 实例化init初始化函数，起到分隔作用域的效果
          return new jQuery.fn.init();
    }
    jQuery.fn = jQuery.prototype = {
          init: function() {
              this.length = 0;
              this.test = function() {
                  return this.length;
              };
              console.log(this)
              return this;
          },
          size: function() {
              return this.length;
          },
          length: 1,
          version: '2.0.3'
     };
   
    // 测试
    console.log($().version); // 'undefined'
    console.log($().test()); // 0
    console.log($().size()); // 报错
```

> * 解决了“作用域”的问题，现在又出现了另外一个问题（我们也可以从上述代码的测试中看到）：**居然无法访问`jQuery.fn`对象的属性和方法**。那我们究竟怎么样才能在返回的实例中访问`jQuery`的原型对象呢？

> * 以下是输出的`this`对象，你会发现，其`__proto__`对象里没有 `jQuery.fn`的属性和方法：

![jquery](/styles/images/jq/jQuery/jQuery-01.png)

---

> * 解决上述问题的方法如下：【点击打开[demo](/effects/demo/jq/$/v4.html)】

```js
    var $ = jQuery = function() {
        // 实例化init初始化函数，起到分隔作用域的效果
          return new jQuery.fn.init();
    }
    jQuery.fn = jQuery.prototype = {
          init: function() {
              this.length = 0;
              this.test = function() {
                  return this.length;
              };
              console.log(this)
              return this;
          },
          size: function() {
              return this.length;
          },
          length: 1,
          version: '2.0.3'
     };
    
    // 新增代码：使用jQuery原型对象覆盖init的原型对象，这就相当于init方法有权利去访问jQuery原型对象的所有属性和方法
    jQuery.fn.init.prototype = jQuery.fn;
   
    // 测试
    console.log($().version); // '2.0.3'
    console.log($().test()); // 0
    console.log($().size()); // 0
```

> * 以下是输出的`this`对象，你会发现，其`__proto__`对象里有 `jQuery.fn`的属性和方法：

![jquery](/styles/images/jq/jQuery/jQuery-02.png)

 > * 注意：`$().size()`的值仍然是`0`，原因是：根据作用域链寻找变量的原理，`init`方法中存在`length`，自然就不会寻找 `jQuery.prototype`下的`length`了
 
## 三、总结

> * 由于要实现链式调用，返回的必然是一个对象，通过这个对象，再调用其下的属性或者方法
> * 由于在自己的函数里返回自己的对象，会出现内存溢出，所以这个方法无效
> * 既然，自己的不行，为何不借助别人的？然后，再将别人的转化成自己的？
> * 个人对于 `jQuery` 的变量对象的实现是这样子的： 
>   * 既然要实现链式调用，函数肯定是返回一个对象，那么返回对象的最经典方法就是“工厂函数模式”，所以，这里我们使用工厂模式返回对象！
>   * 就像创造对象一样，一般构造方法是存储属性的地方，而原型主要是存储方法；
>   * 而`jQuery`这里，归根到底就是创建一个变量，所以属性就存在“构造函数” `init` 里，而方法，则存储在 `jQuery.prototype` 上
>   * 这里其实也用到了一丢丢“原型创建对象”的味道，在 `return new jQuery.fn.init();` 之后，无法访问`jQuery.prototype`上的方法，
>     所以，我们就要 `Query.fn.init.prototype = jQuery.fn;`
> * 说到这里，突然觉得，`jQuery` 对象的创建不就是 “构造函数结合原型” 去创建？只不过，这里不是用自己的，而是借用了别人的！

> * 哦，对了，为什么不是新建一个函数，再借用这个函数的作用域，而是用`jQuery`原型对象上的`init`方法的作用域呢？
>   * 个人理解是：其实 `jQuery.prototype.init` 还不是属于`jQuery`自己身体的一部分，用自己本身的东西要比借用别人的东西要好得多吧！