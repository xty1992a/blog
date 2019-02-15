---
title: hexo写作小技巧
tags:
  - hexo
  - webstorm
categories:
  - hexo
abbrlink: 7b19
date: 2019-02-14 14:58:27
---

1. 快速输入特殊标签
2. 热更新
<!--less-->

## 快速输入hexo标签
hexo使用md作为源码生成博文.除了md语法外,还支持一些hexo特有的标签,使用如下语法
```
{% tag  %}
{% endtag %}
```
打起来还是挺麻烦的.利用`webstorm`的`live templates`简化下(实际上是Emmet,其他支持Emmet的也可以自行设置)
1. ctrl+alt+s打开setting-editor-live templates
2. 右边+号,先添加一个`template group`,名字随意,我起名为md.
3. 对照hexo的[标签文档](https://hexo.io/zh-cn/docs/tag-plugins.html),再次点击+号,添加一个`live template`.
4. `abbreviation`即触发Emmet的关键字,按tab即可快速输入预设`template text`.以`blockquote`为例.我们设置为`bq`,`description`随便写.`template text`将hexo的标签黏贴进去,用`$variable$`占位符占位.
```
{% blockquote $author$ %}
$content$
{% endblockquote %}
```
5. 此时还不能apply,还需要点击`define`设置该`live template`的适用范围,因为没有`md`或者`markdown`选择,我们选择最底部的`other`,在以上范围之外生效
6. apply-ok保存生效.

此时我们在md中即可输入`bq`+tab快速输入模板,光标定位到`author`位置,按tab可切换到`content`位置

## 热更新
作为前端,不能实时预览自己写的东西怎么行,其实非常简单,一个插件搞定.
1. hexo项目根目录下`yarn add hexo-browsersync`.
2. `hexo s`即可.
修改md之后,保存即可自动刷新.可惜不是类似`webpack-dev-server`式的热模替换.

ps.还有个类似的插件`hexo-livereload`,但是要手动刷新,硬伤不能忍.试都没试...
