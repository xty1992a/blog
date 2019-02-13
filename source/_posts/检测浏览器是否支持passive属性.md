---
title: 检测浏览器是否支持passive属性
date: 2019-02-13 14:25:05
tags:
---

`addEventListener`第三个参数以往是`useCapture`,控制回调在捕获或是冒泡阶段执行.默认为false;
签名:
```
target.addEventListener(type, listener[, useCapture]);
```

18年之后,chrome将这个参数改为对象.其中一个属性为`passive`,用来告诉浏览器回调是否会调用preventDefault阻止默认行为.
近年来,移动端势头非常猛,touch相关的事件用的非常频繁.它的默认行为是让页面滚动,在此之前,浏览器会等待回调执行之后再执行默认行为--这样才知道回调中是否有阻止默认行为,如果回调非常耗时,那默认行为(滚动)就会一直到回调完成才执行,就造成了页面的卡顿.据统计,80%的页面都不会阻止默认行为,因此这种卡顿是非常不必要的.
解决方案是,在绑定回调的时候,就显性的告诉浏览器,这个回调不会阻止默认行为,浏览器就不会再等待
将`addEventListener`第三个参数设置为`{passive: true}`即可.

新标准自然是需要进行兼容性检测的.代码如下:
```
// Test via a getter in the options object to see
// if the passive property is accessed
var supportsPassive = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassive = true;
    }
  });
  window.addEventListener("test", null, opts);
} catch (e) {}

// Use our detect's results.
// passive applied if supported, capture will be false either way.
elem.addEventListener(
  'touchstart',
  fn,
  supportsPassive ? { passive: true } : false
);
```

![图片](/images/2.png)

