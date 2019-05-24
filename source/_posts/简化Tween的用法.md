---
title: 简化Tween的用法
tags:
  - canvas
  - 浏览器
  - 动画
categories:
  - - 技术
    - 浏览器
  - - 技术
    - Tween
abbrlink: 71fa
date: 2019-05-24 10:07:16
---
```javascript
    const manager = new TweenManager({duration, start, end})
    while(manager.next()) {
        await TweenManager.frame()
        const value = manager.currentValue
        // do something
    }
```

<!--less-->
#### 引子
写js动画是件麻烦的事.需要缓动函数,需要定时器,递归的话需要考虑边界条件.而且缓动函数用起来也很别扭,参数多,又难记.t,b,c,d每次用都得去看下注释.
最近用到一个浏览器的API,`createTreeWalker`,这个方法返回一个`TreeWalker`对象.可以用来遍历dom树
用法如下
```javascript
while(tree.nextNode()){
    const dom = tree.currentNode
    // dosomething
}
```
一时间思维发散.如果按照这种设计方式来搞一个缓动函数的管理类,应该可以简化Tween的使用方式,省的每次去记API.

#### 帧管理
实现上一节提到的还不够.写动画麻烦还在于`requestAnimationFrame`这个API用起来也是挺麻烦的.需要递归调用.
比如一个回到顶部的动画
```javascript
function backTop(duration) {
    const doc = document.body.scrollTop ? document.body : document.documentElement;
    const start = doc.scrollTop;
    const stamp = Date.now()

    function step() {
        let currentStep = Date.now() - stamp
        if (currentStep >= duration) {
            doc.scrollTop = 0
            return
        }
        doc.scrollTop = Tween.Linear(currentStep, start, -start, duration)
        requestAnimationFrame(step)
    }

    step()
}
```
写法是比较繁琐的.仔细考虑,其实递归只是期望定时执行而已.如果是其他语言.一个sleep就搞定了.`JavaScript`虽然没有sleep,但有了`async/await`,我们也可以实现一个.
```javascript
 const sleep = time => new Promise(resolve => setTimeout(resolve, time));

 (async () => {
     console.log('1');
     await sleep(1000);
     console.log('2');
 })();
```
而`requestAnimationFrame`其实可以与`sleep(16)`互相代替,那我们可以实现一个`frame`方法.
```javascript
const frame = () => requestAnimationFrame ? new Promise(requestAnimationFrame) : sleep(16);
 (async () => {
     await frame();
     console.log('1 frame');
 })();
```

#### 具体实现
我们期望的用法确定了.接下来实现.其实代码不多.
```javascript
const dftOption = {
    duration: 300,
    start: 0,
    end: 0,
    easing: Tween.Linear,
}
class TweenManager {
    get distance() {
      return this.$options.end - this.$options.start
    }

    get now() {
      return Date.now ? Date.now() : new Date().getTime()
    }

    get currentStep() {
      return this.now - this.stamp
    }

    get currentValue() {
      const {distance, currentStep} = this
      const {duration, easing, start} = this.$options
      return easing(currentStep, start, distance, duration)
    }

    constructor(opt = {}) {
      this.$options = {...dftOption, ...opt}
      this.stamp = this.now
    }

    next() {
      return this.$options.duration > this.currentStep
    }

    static sleep(time = 0) {
      return new Promise(resolve => setTimeout(resolve, time))
    }

    static frame() {
      return requestAnimationFrame ? new Promise(requestAnimationFrame) : TweenManager.sleep(16)
    }
}
```

#### 使用示例
同样是回到顶部的动画,可以简化成这样.
```javascript
function backTop(duration) {
	const doc = document.body.scrollTop ? document.body : document.documentElement;
	const start = doc.scrollTop;
	const manager = new TweenManager({duration, start, end: 0, easing: Tween.Linear});
	while (manager.next()) {
	  await TweenManager.frame();
	  doc.scrollTop = manager.currentValue;
	}
	console.log('done');
}
```
好像没少多少???
嗯,心智负担降了一丢丢.多少还是方便一点了吧...
溜了溜了...
