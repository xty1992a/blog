---
title: 用canvas实现无限轮播
tags:
  - canvas
  - 浏览器
  - JavaScript
  - 轮子
categories:
  - - 技术
    - 浏览器
abbrlink: 20b2
date: 2019-12-04 16:06:58
---

轮播实现有很多种方式,用canvas的估计不多吧.
<!--less-->

> 引子
上次造了个 {% post_link 记一个轻量截图库的实现 截图的轮子 %},感觉image-model+store这种模式还有潜力可挖掘.因此起意造一个类似photoswipe的可缩放,可轮播的类库.

## 需求分析
使用canvas实现轮播,常规的基于DOM的轮播思路就行不通了 --- 即前后补图的方式
仔细分析轮播的交互,在一次交互中,最多只能看到3张图片,当前展示的图片,前一张,后一张.
那我们这种轮播,最多只需要存在三个图片模型.其余全部存在一个池中,更换时,多余的回到池中,新的加入展示.
比如`1[2]3`向左滑动切到下一页,1加入池,4加入展示,最终更换为`2[3]4`.
当图片为最后一个或第一个时,相应的指向头尾.
而即便图片只有一个,也展示为`1[1]1`
我们可以实现一个`Ring`类来描述这种数据结构.每一个元素,都可以查询它的前后节点.

## 整体结构
1. 主类[Gallery](https://github.com/xty1992a/gallery/blob/master/src/core/index.ts),这个类是最终暴露的类,它负责解析配置,提供API给使用者,以及渲染内容.统筹子类等.
2. [Ring](https://github.com/xty1992a/gallery/blob/master/src/helpers/ring.ts)类,用于存储图片链接,通过它,每一个链接都可以获取到前后的链接.
3. [ImageModel](https://github.com/xty1992a/gallery/blob/master/src/core/image-model.ts)类,用于描述一个图片的位置,尺寸,提供缓动API.
3. [EventsManager](https://github.com/xty1992a/gallery/blob/master/src/core/events-manager.ts)类,接管dom事件监听,兼容移动和PC,合成派发事件给主类进行操作.
4. [Store](https://github.com/xty1992a/gallery/blob/master/src/helpers/store.ts)类,用于共享一些数据.
5. [TweenManger](https://github.com/xty1992a/gallery/blob/master/src/helpers/tween-manager.ts)类,用于管理缓动函数

## 关键代码
### 环形数据结构Ring
实际代码非常简单.基本上基于数组,然后对于头尾做处理即可.
```typescript
// class Ring
class Ring {
  list: any[];

  constructor(list: any[]) {
    this.list = [...list];
  }

  push(item: any) {
    this.list.push(item);
  }

  getNextBy(item: any, isSame = (a: any, b: any) => a === b) {
    const index = this.list.findIndex(it => isSame(it, item));
    if (index === -1) return;
    if (index === this.list.length - 1) return this.list[0];
    return this.list[index + 1];
  }

  getPrevBy(item: any, isSame = (a: any, b: any) => a === b) {
    const index = this.list.findIndex(it => isSame(it, item));
    if (index === -1) return;
    if (index === 0) return this.list[this.list.length - 1];
    return this.list[index - 1];
  }
}

export default Ring;
```
有了这个类,再配合get取值函数,就可以持续生成三个联动的图片模型.
```typescript
// class Gallery
// 缓存图片模型.
function getImageModel(url: string) {
  let model = this.imageModelMap[url];
  if (!model) {
    model = this.imageModelMap[url] = new ImageModel({
      imageUrl: url,
      store: this.$store
    });
  }
  return model;
}
class Gallery{
    // other code...
    // 取值函数会在该属性被读取时调用
    get prevImageUrl() {
        return this.$urlRing.getPrevBy(this.currentImageUrl);
    }

    get nextImageUrl() {
        return this.$urlRing.getNextBy(this.currentImageUrl);
    }

    // 图片模型
    protected get currentImage() {
        const url = this.currentImageUrl;
        return getImageModel.call(this, url);
    }
    protected get prevImage() {
        const url = this.prevImageUrl;
        return getImageModel.call(this, url);
    }
    protected get nextImage() {
        const url = this.nextImageUrl;
        return getImageModel.call(this, url);
    }
}
```
可以看出,`currentImageUrl`是核心.当切换图片时,只要更新这一个属性就可以完成所有图片模型的更换创建.

### 绘制
有了上面三个图片模型,我们就可以完成绘制操作.
任何操作,都需要先更新图片模型,再调用`render`使数据层面的变化呈现到画面上---有没有很熟悉?没错,就是`mvvm`的干活.
```typescript
  protected async render() {
    const {
      ctx,
      currentImage: current,
      prevImage: prev,
      nextImage: next
    } = this;
    if (!prev.img) await prev.init();
    if (!current.img) await current.init();
    if (!next.img) await next.init();
    // 在init完成后再获取WIDTH才能保证准确
    const {WIDTH, HEIGHT} = this;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.save();
    ctx.drawImage(prev.img, prev.x - WIDTH, prev.y, prev.width, prev.height);
    ctx.drawImage(next.img, next.x + WIDTH, next.y, next.width, next.height);
    ctx.drawImage(
      current.img,
      current.x,
      current.y,
      current.width,
      current.height
    );
    ctx.restore();
  }
```
这次的render没有截图库那么多花样,直接按照model的尺寸坐标画上去就完了.
因为做了图片的懒加载,图片模型的初始化是在此时完成的.
可以看出,三个await,无疑是串行的.但这是有意为之.
如果图片只有一个时,三个图片模型实际上都是同一个.并行执行init就会产生问题.虽然加锁可以解决问题.不过没必要增加复杂度.我们可以预先获取一部分图片,缓存会使init完成的非常快,基本不影响使用.

### 处理用户操作
原生dom事件的处理全部由`EventsManager`维护.它会将不同平台,不同来源的事件合成为统一的事件派发出来.
比如把双指落下,移动产生的缩放和鼠标滚轮产生的缩放合并为`zoom`事件,事件携带的参数带上计算后的zoom事件原点,以及zoom的方向.主类不关心事件来源.它只管在zoom事件发生时,进行响应即可.
这里我们不去深究`EventsManager`的实现.有兴趣可以直接看[代码](https://github.com/xty1992a/gallery/blob/master/src/core/events-manager.ts).以下看对它派发事件的响应.
```typescript
// class Gallery
class Gallery{
    // other code
  protected handleEvents() {
    // 处理事件监听器派发的事件
    const events = this.$eventsManger;
    events.on("point-down", () => {
      if (this.currentImage.onAnimation) return;
      // 各imageModel记录当前位置
      this.prevImage.start();
      this.currentImage.start();
      this.nextImage.start();
    });
    events.on("point-move", e => {
      if (this.currentImage.onAnimation) return;
      const delta = {
        x: e.deltaX,
        y: e.deltaY
      };
      // 没有缩放时,为轮播模式
      if (this.currentImage.width === this.currentImage.initialWidth) {
        // 屏蔽y轴方向的移动.
        delta.y = 0;
        // 同步移动前后图片
        this.prevImage.move(delta);
        this.nextImage.move(delta);
      }
      // 否则为预览模式,当前图片自由移动.
      this.currentImage.move(delta);
      this.render();
    });
    events.on("point-up", e => {
      if (this.currentImage.onAnimation) return;
      // 缩放时,什么都不做
      if (this.currentImage.zoomDirection < 0) return;
      // 没有缩放时,检查移动方向
      if (this.currentImage.shouldNext()) return this.next();
      if (this.currentImage.shouldPrev()) return this.prev();
      // 移动不足切换,回到原位,directionX表示up之前的移动方向
      this.stay(e.directionX);
    });
    events.on("zoom", e => {
      // 参数为缩放中心点,缩放方向
      this.currentImage.zoom(e.origin, e.direction);
      this.render();
    });
    events.on("db-click", e => {
      this.zoomOn(e);
    });
  }
}
```
上面代码都比较语义化,应该很容易理解.下面附上各事件用到的一些方法
1. 当鼠标/手指落下时,重置各个图片模型的一些坐标信息.
```typescript
 // class ImageModel
  start() {
    this.position = {
      x: this.x,
      y: this.y
    };
  }
```
2. 移动时,这个事件会携带与`point-down`比较产生的位移.
因为`Gallery`还支持缩放预览,所以此时需要检查,如果没有缩放,则是轮播模式,屏蔽y轴的位移.使所有的图片模型移动.
如果是缩放,则只有当前图片自由移动.
移动的代码也非常简单.就是用start时的起始位置,加上位移即可.
```typescript
 // class ImageModel
  move(delta: { x: number; y: number }) {
    this.x = this.position.x + delta.x * this.dpr;
    this.y = this.position.y + delta.y * this.dpr;
  }
```
3. 手指/鼠标抬起,做一些收尾检查工作.这个事件会携带抬起时的坐标与之前move的方向.
缩放预览模式无需处理.而如果是轮播模式,则需决定下一步动作,如前文所述,可以换页,或者回到原位.
```typescript
  // class ImageModel
  shouldNext() {
    return this.x < -this.WIDTH / 3;
  }

  shouldPrev() {
    return this.x > this.WIDTH / 3;
  }
```
4. 缩放事件及双击事件直接调用主类API进行响应.

### 暴露的主类API
上面用到的`next`,`prev`,`stay`,以及`zoom`,`zoomOn`就是主类对外暴露的API了.下面来看这些API的实现.
前三个API非常类似.以next为例
```typescript
  // class Gallery
  async next() {
    const current = this.currentImage,
      sibling = this.nextImage;
    if (current.onAnimation) return;
    current.startMove(-1);
    sibling.startMove(-1);
    while (current.nextFrame() && sibling.nextFrame()) {
      await utils.frame();
      this.render();
    }
    this.currentImageUrl = this.$urlRing.getNextBy(this.currentImageUrl);
    this.restore();
  }
```
切到下一页,将`currentImageUrl`指定为它的下一个节点.即可完成三个图片模型的更换.
但这个过程当然不能太生硬,需要加入缓动动画过渡一下.如果是dom,我们只需要指定最终位置并加上transition,css会帮我们完成缓动.但canvas就需要基于js完成缓动.
js动画离不开tween.张鑫旭老师[这篇文章](https://www.zhangxinxu.com/wordpress/2016/12/how-use-tween-js-animation-easing/)介绍了它的使用方式.
但文章里介绍的callback的方式不直观,而且我们这里涉及到多个对象的缓动,掺杂在一起难写难理解.
本质上,js缓动动画就是在每一帧,更新动画进度,然后将变动呈现到浏览器上.
我之前曾写过一种结合新语法async/await的[动画写法](https://juejin.im/post/5ce768ec6fb9a07ecd3d3675),正好非常适合当前这个场景.
在一个while循环中,调用动画对象的`nextFrame`更新动画对象的进度.并决定是否跳出.
而在循环内,则用来重绘canvas.帧间隔则用promise和定时器或`RAF`控制.
> `const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));`
> `const frame = () =>  requestAnimationFrame ? new Promise(requestAnimationFrame) : sleep(16);`

背景介绍完了.再来看代码.
在过渡到next这个过程中.只有当前图片和下一个图片可见,因此只需要更新这两个图片模型.首先调用`startMove`创建`TweenManager`,参数决定了最终目的.
接下来在动画期间内,每隔一帧更新ImageModel的动画进度并绘制.
动画结束,切换图片模型.调用`restore`恢复一些脏数据.
以下是这里用到几个ImageModel类的API
```typescript
  // class ImageModel
  startMove(direction: number) {
    this.onAnimation = true;

    // 实例化tween管理器
    this.animationManger = new TweenManger<number>({
      start: this.x,
      // direction决定了移动方向
      end: this.initialX + direction * this.WIDTH,
      duration: this.$options.animationDuration,
      easing: this.$options.animationEasing
    });
  }

  nextFrame() {
    if (!this.onAnimation) return false;
    let flag = this.animationManger.next();
    let value = this.animationManger.currentValue;
    if (!flag) {
      value = this.animationManger.$options.end;
    }
    // 位移缓动处理
    if (typeof value === "number") {
      this.x = value;
    }
    // 缩放缓动处理,可以先忽略
    else if (Array.isArray(value)) {
      this.x = value[0];
      this.y = value[1];
      this.width = value[2];
      this.height = value[3];
    }
    else {
      return false;
    }
    return flag;
  }
```
创建`TweenManager`时,将当前坐标设置为起点,再由`next`,`prev`,`stay`指定终点.分别是-1,1,0倍画布宽度.

而`zoom`,`zoomOn`两个API,在本文开头提到的{% post_link 记一个轻量截图库的实现 截图的轮子 %}中有详细介绍.而且注意本文标题,轮播才是重点😂,因此不再赘述.

## 结语
这个库其实存在一个不足之处 --- 只能处理图片元素的轮播.不能像基于dom的轮播随便装元素.
当然,和以往的轮子一样,这纯属摸鱼打发时间的玩具.因此没有考虑太多兼容性,体积等问题.主要是提供一些思路.纯当引玉之砖.
正好快下班了,又当了一天薪水小偷,赚了赚了,溜了溜了.回家打游戏~~~
