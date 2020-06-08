---
title: vue3.0尝鲜，写一个win10日历
abbrlink: 59f5054f
date: 2020-04-23 19:00:27
tags:
- 浏览器
- 轮子
- vuejs
categories:
- [技术,浏览器]
- [技术,vue]
---

 {% codepen xty1992a dyYNzKa dark result 450 %}
<!--less-->
> 引子  
> 这几日前端最热门的消息无外乎vue3.0的发布，虽然不是正式版，也让人想一探究竟。
> 正好下午无事，便略过了过文档。不过学东西最好的方式还是学以致用。
> 四处打量打量，正好看到win10的日历，哎呦，不错，就是你了。

效果如下图：
![calendar](/images/preview.gif)

[一个简单的在线原型](https://codepen.io/xty1992a/pen/dyYNzKa)
[完整预览链接](https://xty1992a.github.io/win10-calendar/index.html)
 {% codepen xty1992a dyYNzKa dark result 450 %}

### 搭建vue3.0项目
工欲善其事，必先起脚手架，好在有@vue/cli的支持，搭项目变得非常简单。
1. `vue create win10-calendar`
2. `cd win10-calendar && vue add vue-next`

### 需求分析
需求很清晰，抄。
抄之前得先研究抄的对象。
仔细操作后，可以发现日历的头部共有三个可操作区域。
年/月部分点击可以切换视图，分别是日历表，月份表，年份表，层层递进。
上下两个箭头在不同视图下作用不同，日历表中控制月份，月份表中控制年份，年份表中一次控制N年。
鼠标悬浮在表格上时，有一个探照灯的效果，挺有意思。
表格切换，也有缩进，扩张的动画效果。

分析到这里，代码组织基本确定了。
组件入口，组件头部，日历表，月份表，年份表5个组件。
探照灯效果为便于抽象，也单独提取为一个组件。总计6个组件。  

三个表格看似展示不同的东西，实际上存在关联，其实都是对于同一个日期不同纬度的展示。
而头部则负责对这个日期进行修改编辑，以及切换不同的视图。
而组件入口，自然负责将这些子组件统合，而且子组件的状态也需要提升到它这个层级。

再来看探照灯，css并没有一个探照灯属性可以像`box-shadow`一样方便，加上就高亮一个区域。
不过css魔法就是脑筋急转弯，得绕着弯想。
假设我们做一个全黑的蒙层，中间挖个洞，鼠标移动的时候，使蒙层的中心跟随鼠标，不就是一个探照灯了吗。
至于不悬浮时，文字也要可见，悬浮时，文字与格子边框同时可见，也很简单，把文字定位，z-index提高，让它们【浮出水面】就可以了。

### 编写组件
vue3据说支持vue2.x的大部分特性。vue单文件也依然是支持的。
新建`Calendar/index.vue`组件，顺便添加子组件。文件结构如下
```
Calendar
    index.vue
    children
        CalendarHead.vue
        DatPanel.vue
        MonhPanel.vue
        YeaPanel.vue
        Mask.js
```
script部分，大部分的属性都可以去掉了。添加一个setup函数。
在vue3中，setup这个函数会在beforeCreate和created之间调用。它可以返回一个渲染函数，也可以返回一个对象。对象中包含的字段，就可以在模板中使用。

#### index初期
先在index.vue添加一些全局状态，比如日期对象。
这些状态需要向下传递到子组件，子组件也需要能够更改这些状态。vue2.x一般用props/event的方式，说实话是有些繁琐的。如果用vuex又感觉太过笨重。

vue3则提供了一套provide/inject的机制，虽然vue2.x也有，但与props一样是需要声明的。
通过provide/inject API,可以直接向任意层级的子组件直接通过一个约定的key进行任意值的传递。
```javascript
// index.vue
import {ref, provide} from 'vue';
import dayjs from "dayjs";

export default {
    setup() {
        const date = ref(dayjs().toDate());
        const setDate = (value) => {
          date.value = dayjs(value).toDate();
        };
        const displayMode = ref("date");
        const setDisplayMode = (mode) => {
          displayMode.value = mode;
        };

        provide("displayMode", [displayMode, setDisplayMode]);
        provide("date", [date, setDate]);

        return {}     
    }
}
```
子组件可以直接通过inject API获取到index中声明的值与设值函数。

#### 日历表组件
先来编写日历表
```javascript
// DatePanel.vue
import { computed, h, inject } from "vue";
import dayjs from "dayjs";

export default {
  setup() {
    const [date, setDate] = inject("date");
    const dateList = computed(() => getDateList(date.value));
    return {
      dateList,
      weeks: ["日", "一", "二", "三", "四", "五", "六"],
    };
  },
}

// 生成日历表
function getDateList(date) {
  // 本月第一天
  const day0 = dayjs(date).startOf("month");
  // 本月第一个星期的星期日
  const firstDay = day0.subtract(day0.get("day"), "day");
  const rows = 6; //Math.ceil((day0.get("day") + day0.daysInMonth()) / 7);
  return Array(rows * 7)
    .fill(0)
    .map((n, i) => firstDay.add(i, "day"));
}
```
win10的日历表从周一开始，也就是js中星期的1开始，为了便于计算，我们从周日开始，也就是js中星期的0开始。
计算日历表，我们只需要计算出本月第一个星期的星期日的日期，然后从这天开始，依次递增，就可以得到整个日历表。
为了保证日历表的高度稳定，固定放6个星期，也就是42天。
模板和css部分就不放了。有兴趣直接访问[源码](https://github.com/xty1992a/win10-calendar/blob/master/src/components/Calendar/children/DatePanel.vue)

#### 探照灯蒙层
有了基本布局，可以来着手蒙层的编写。
这个组件我们来试试函数组件。函数式组件推测是直接拿来当组件的setup部分来用的，没看源码，说错勿怪。
函数可以直接返回jsx，不知道是不是现阶段的jsx解析有问题，非原生属性都无法通过jsx传递，只能通过attrs属性统一获得。
好在这个组件的模板部分非常简单，动态的部分只有style而已。
通过上面的分析，探照灯实际是一个挖孔蒙层，这个效果可以通过径向渐变来实现。
```less
radial-gradient(transparent, rgba(0, 0, 0, 1) 60px, #000)
```
要让它动起来，我们需要实时获取鼠标在元素上的坐标。
这样的一个功能，官方有个非常合适的[例子](https://vue-composition-api-rfc.netlify.app/#logic-extraction-and-reuse)，拿来改一改就能用。
我们把这个功能也抽象成一个hook
```javascript
// src/hooks/useMousePosition.js
import { onMounted, onUnmounted, toRefs, reactive } from "vue";

// 传入一个dom引用,鼠标移入该元素时,派发鼠标在该元素上的位置
export default function (elRef) {
  const state = reactive({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    enter: false,
  });
  let rect = {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  };

  function onEnter() {
    if (!elRef || !elRef.value) return;
    state.enter = true;
    rect = elRef.value.getBoundingClientRect();
    state.height = rect.height;
    state.width = rect.width;
  }
  function onMove(e) {
    const { clientX, clientY } = e;
    state.x = clientX - rect.left;
    state.y = clientY - rect.top;
  }
  function onLeave() {
    state.enter = false;
  }

  onMounted(() => {
    if (!elRef || !elRef.value) return;
    elRef.value.addEventListener("mouseenter", onEnter);
    elRef.value.addEventListener("mousemove", onMove);
    elRef.value.addEventListener("mouseleave", onLeave);
  });

  onUnmounted(() => {
    if (!elRef || !elRef.value) return;
    elRef.value.removeEventListener("mousemove", onMove);
    elRef.value.removeEventListener("mouseenter", onEnter);
    elRef.value.removeEventListener("mouseleave", onLeave);
  });

  return {
    ...toRefs(state),
  };
}
```
修改index.vue。
```javascript
import useMousePosition from "@/hooks/useMousePosition";

export default {
    setup(){
        const el = ref(null);
        const position = useMousePosition(el);
        return {
          el
        }
    }
}
```
模板部分
```html
<div class="calendar" ref="el">
<!--other-->
<Mask :position="position"/>
</div>
```
> 注意模板中引用ref不能加`:`,这里非常容易认为模板中需要将setup中的el的引用绑定给元素，实际上只需要给元素的ref绑定字符串el。
> &lt;div ref="el"></div> ✅
> &lt;div :ref="el"></div> ❌

有了父组件提供坐标尺寸信息，Mask组件就可以动起来了。
由于Mask会在父组件中移动，移动到边缘时，就可能露馅，因此可以把它的尺寸放大为父组件的2倍。
同时，为了保持其中心与鼠标重叠，需要向左上偏移自身尺寸的1/2。
```jsx
// Mask.js
import { computed, h } from "vue"; // 使用jsx必须引入h

export default function Mask(props) {
  const position = props.position;
  const style = computed(() => {
    const size = Math.max(position.width, position.height) * 2;
    const isEnter = position.enter;
    return {
      transform: `translate(${position.x - size / 2}px, ${
        position.y - size / 2
      }px)`,
      backgroundImage: isEnter
        ? `radial-gradient(transparent, rgba(0, 0, 0, 1) 60px, #000)`
        : "",
      backgroundColor: isEnter ? "" : "#000",
      width: size ? size + "px" : "100%",
      height: size ? size + "px" : "100%",
    };
  });

  return <div class="mask" style={style.value} />;
}
```
> ps 通过模板解析的响应式值，会自动将它的value传递给子组件，所以通过props取得的值，就不需要加.value取值了。

#### 操作区组件
现在基本的效果已经有了，鼠标移来移去还有酷炫的效果。让我们继续来完善它。
转移战线到CalendarHead组件。
这里的主要的操作有两个，一个是切换视图，一个上下调整日期。
index已经通过provide向子组件开放了这两个值的读写。
切换视图，只需要检查当前视图，并做递进即可。
调整日期，同样需要检查视图。
当前为日历表时，调整幅度为正负一个月
当前为月份表时，调整幅度为正负一年
当前为年份表时，调整幅度为正负十六月

```javascript
import {inject, ref, computed} from "vue";
import dayjs from 'dayjs'

export default {
  setup() {
    const [displayMode, setDisplayMode] = inject("displayMode", [ref("date"), (v) => v]);
    const [date, setDate] = inject("date", [ref(new Date()), (v) => v]);
    const setPanelMode = () => {
        let mode = "date";
        if (displayMode.value === "date") {
          mode = "month";
        }
        if (displayMode.value === "month") {
          mode = "year";
        }
        if (displayMode.value === "year") {
          mode = "year";
        }
        setDisplayMode(mode);
    };
    const dateString = computed(() => (displayMode.value === "date" ? fmtDate : fmtYear)(date.value));

    const handleDate = (isAdd) => () => {
        const setMap = {
          date: {
            value: 1,
            unit: "month",
          },
          month: {
            value: 1,
            unit: "year",
          },
          year: {
            value: 16,
            unit: "year",
          },
        };
        
        const setter = setMap[displayMode.value];
        
        const value = isAdd
          ? dayjs(date.value).add(setter.value, setter.unit)
          : dayjs(date.value).subtract(setter.value, setter.unit);
        setDate(value.toDate());
    };
    const upward = handleDate(false);
    const downward = handleDate(true);
    return {
        upward,
        downward,
        setPanelMode,
        dateString,
    }
  }
}
```

#### 月份/年份组件
现在的操作可以在日历表上切换月份了，接下来加上月份/年份表。
先修改index.vue，响应displayMode的变化，并为动画作准备。
这里使用组合API中的watch来主动监视响应式值的变化。当displayMode变化时，切换componentName与transitionName。
> 动画分两种，向上级切换是缩进，向下级切换是扩张，监视新旧视图模式可得。

```javascript
// index.vue
export default {
setup() {
      // other code
    const transitionName = ref("out");
    const componentName = ref("date-panel");
    const levels = ["date", "month", "year"];
    watch(displayMode, (now, old) => {
        const nowLevel = levels.indexOf(now);
        const oldLevel = levels.indexOf(old);
        transitionName.value = nowLevel < oldLevel ? "out" : "in";
        // componentName必须在transitionName设置之后或同时设置才不会使transitionName滞后
        componentName.value = {
          date: "date-panel",
          month: "month-panel",
          year: "year-panel",
        }[displayMode.value];
    });
    return {
        componentName,
        transitionName,
    }
}
}
```
模板部分
```html
  <div class="calendar" ref="el">
    <CalendarHead/>
    <div class="cell-wrap">
      <transition :name="transitionName">
        <component :is="componentName"/>
      </transition>
    </div>
    <Mask :position="position"/>
  </div>
```
回到正题。
其实月份表和年份表也有一个操作。
点击月份表，切换日期为选中的年月，切换视图为日历表。
点击年份表，切换日期为选中的年份，切换视图为月份表。
通过index.vue下放的displayMode和date，可以很容易完成。
```javascript
// MonthPanel
import { computed, inject, ref } from "vue";
import dayjs from "dayjs";
export default {
  setup() {
    const [date, setDate] = inject("date", [ref(new Date()), (v) => v]);
    const [displayMode, setDisplayMode] = inject("displayMode", [ef("date"),(v) => v]);
    const monthList = computed(() => {
      const month0 = dayjs(date.value).month(0);
      return Array(16)
        .fill(0)
        .map((n, i) => month0.add(i, "month"));
    });

    const getClass = (item) => {
      return [
        "month-cell",
        item.month() === dayjs(date.value).month() && " current-month ",
        item.year() === dayjs(date.value).year() && " current-year ",
      ].join(" ");
    };
    const pickMonth = (item) => {
      setDate(item.toDate());
      setDisplayMode("date");
    };

    return {
      monthList,
      getClass,
      pickMonth,
    };
  },
};
```
年份表大同小异，就不放了，有兴趣直接查看[年份表源码](https://github.com/xty1992a/win10-calendar/blob/master/src/components/Calendar/children/YearPanel.vue)与[月份表源码](https://github.com/xty1992a/win10-calendar/blob/master/src/components/Calendar/children/MonthPanel.vue)

### 总结
这样一个小玩具，基本上把vue3常用的API过了一遍。编写过程中，也遇到不少困难，有些是不熟悉新API,有些是见知障，有些则是vue3本身的不成熟。当然，学新东西遇到困难是好事。克服了还是有所收获的。
vue3总地来说，潜力不小，特别是hooks这种理念非常有潜力，react已经有swr这种库，可以想象以后一些繁琐复杂的逻辑都可以像这样封装，好处自然不用说，坏处可能就是开发者更加接触不到比较底层的东西了。
有人认为react/vue之类的库，已经让很多新入门的开发者已经不知道怎么操作dom了，以后这种情况可能会加剧，开发者不知道怎么写一个上拉加载，只知道npm install...
说回vue。组合API的设计可以在开发一些小组件时不再需要拼字符串或者使用preact之类的轻量渲染库了。而且可以更轻易的移植到其他端，估计一堆小程序框架又要忙着升级了（再次坚定了小程序用原生的念头...）。
再说说体验不好的地方。
1. ref.value这个设计有点讨厌，很容易混淆，有时候需要`.value`,有时候不需要。而且基础值除了包装就没有更好的拦截方式了吗？可能包装并不是唯一解，比如直接包装当前模块对象或上下文环境？口胡勿信（笑
2. ts支持还不够好，一开始是直接上ts的，然而各种不顺利，加上不熟悉的地方很多，为了更好的排除问题，就回退js了。还是不够开箱即用啊。
3. 模板中的ref可能是为了兼容以前的旧用法，依然是字符串，但如果能支持下绑定ref值就更好了，不然很容易让人困惑。
