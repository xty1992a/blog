---
title: canvas小练习
tags:
  - canvas
  - 浏览器
categories:
  - - 技术
    - 浏览器
abbrlink: b7ff
date: 2019-03-27 10:55:02
---


<!--less-->
#### 引子
项目进入尾声,想找个[404](https://www.figma.com/404/)的效果作为彩蛋什么的.

这个网站弄了个canvas小游戏,挺好玩的.正好事情做得差不多.便开始折腾.

#### 效果分析
效果很简单,就是将一堆控制点连线构成闭合形状,然后填充,如果一个闭合形状内还有另一个闭合形状,则内部的形状填充方式为反色.
连线方式分为两种.
一种直线连接,也就是`4`部分,这一部分直接lineTo就可以,
一种是曲线,即`0`部分,点击控制点,每个控制点将会出现两个子级控制点.类似PS中的钢笔工具.拖拽子级控制点,可以控制曲线的曲率.其实就是三次贝塞尔曲线.canvas中的API是`bezierCurveTo`
以上是绘制部分,也就是说我们需要实现一个按照一些连续的控制点,依次绘制的方法.

可以呈现静态图形是第一步.下一步就是控制.
我们需要在鼠标落下时,判断是否命中控制点,移动时更新控制点,并进行图形的重绘.
canvas内部没有dom,我们只知道鼠标落在哪里,却不能知道它点了谁,因此我们需要实现一个碰撞算法.
这个问题可以抽象为一个点是否命中一个圆,再进一步抽象,可以抽象为平面坐标系内两点的距离--点是否命中圆,只需要检查点与圆心的距离是否小于圆半径即可.
公式如下
```
d^2=(x1-x2)^2+(y1-y2)^2
```

#### 代码组织
按照上述分析.我们主要需要两个类来实现绘图及控制.

绘图类`Filler`,
它最主要需要实现一个`draw`方法,可以按照控制点数组绘制连续的形状,以及控制点本身

控制类`Manager`
这个类用于监听dom事件,检查是否命中落点,在各事件节点派发事件,提供数据

先实现控制类
还是先创建{% post_link 造个拖拽排序的轮子 事件基类 %}
然后继承这个基类,使`Manager`获得事件派发能力
manager接受一个dom作为参数,它将监听这个dom的鼠标事件,并实时获取鼠标在dom中的坐标.
```javascript
	getOffset() {
	  this.elRect = this.$el.getBoundingClientRect()
	}

	getPosition(e) {
	  let {left, top} = this.elRect
	  let {clientX, clientY} = e
	  let x = (clientX - left) * 2 // canvas放大倍率,即元素尺寸与元素css尺寸的比值
	  let y = (clientY - top) * 2
	  return {x, y}
	}
```
监听鼠标事件,在合适的时机,派发事件
```javascript

	down(e) {
	  this.mouseHadDown = true
	  this.getOffset()
	  let {x, y} = this.getPosition(e)
	  this.hitPoint = this.getHitPoint({x, y}) || null
	  this.hitPoint && this.fire('hit', this.hitPoint)
	}

	move(e) {
	  if (!this.mouseHadDown) return
	  let {x, y} = this.getPosition(e)

	  if (this.hitPoint) {
		this.fire('move', {x, y})
	  }
	}

	up(e) {
	  if (!this.mouseHadDown) return
	  this.mouseHadDown = false
	  this.hitPoint = null
	  this.fire('over')
	}
```
获取命中点的算法
```javascript
// 点与圆心的距离小于圆半径即命中
const getHitPoint = (point, points) => points.find(it => Math.sqrt(Math.pow(it.x - point.x, 2) + Math.pow(it.y - point.y, 2)) < it.r)

getHitPoint(point) {
  return getHitPoint(point, this.points)
}
```


#### 曲线部分
查看[MDN文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes),三次贝塞尔曲线签名如下
```javascript
bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
```
先来设定控制点,与直线控制点不同,它除了自身的坐标,还有子级控制点的坐标.并且有两个,一个用于与下一条点连线,命名为c1,一个用于与上一条连线,命名为c2.
想象连线过程.首先移动到起始点,然后`bezierCurveTo`下一个点.
参数分别是当前点的c1,下一点next的c2,以及next本身,重复这个过程直到最后一个时,回头`bezierCurveTo`起始点,连线结束.
使用数组可以实现这个过程,但有一种数据结构更为合适--循环链表,每个节点都保存下一个节点的引用,最后一个节点的下一个则指向头部.

##### 链表
JS没有内置链表,需要我们自行实现.
参考[这个实现](https://juejin.im/entry/59cb70995188256aa423b680),我们需要定义两个类,一个表示节点,一个表示链表.
节点非常简单,代码如下
```javascript
class LNode {
    constructor(key, data) {
      this.key = key
      this.data = data
      this.next = null
      this.prev = null
    }
}
```
用key来区分不同的节点,data则用来承载数据.

链表我们只实现我们需要用到的API,一个用于加入新节点的`push`方法,一个用于遍历所有节点的`each`方法
```javascript
class LList{
    constructor(opt) {
        if (Array.isArray(opt)) {
            let first = opt.splice(0, 1)[0]
            let head = this.head = new LNode(first.key, first.data)
            head.next = head
            head.prev = head
            this.length = 1
            opt.forEach(it => this.push(it))
        }
        else {
            let head = this.head = new LNode('head', null)
            this.length = 1
            head.next = head
            head.prev = head
        }
    }
}
```




