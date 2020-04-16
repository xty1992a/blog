---
title: webstorm整合prettier
abbrlink: 224b2066
date: 2020-04-16 15:10:22
tags:
categories:
---

保存时自动格式化这个需求很吸引人.
奈何没有哪个IDE或编辑器默认支持.

webstorm2020.1之前.可以利用宏功能,录制一个先格式化,再保存的宏,然后将该宏的快捷键指定为`ctrl+s`.可以实现这个功能.
具体步骤如下:
1. settting(`ctrl+alt+s`)-keymap修改原`save all`的快捷键为`alt+;`(任意你喜欢的快捷键);
2. Edit-Macros-Start Macro-Recording开始录制宏;
3. 先按`ctrl+alt+l`格式化,再按`alt+;`保存;
4. Edit-Macros-Stop Macro-Recording结束录制宏,然后命名这个宏`format&save`;
5. keymap中搜索刚刚命名的宏,定位之后绑定`alt+s`;

这个操作还是有的麻烦的.

webstorm更新后,看了下升级文档.发现官方已经支持了prettier.尝试配置了一下,非常简单.
1. `npm i prettier -g`全局安装prettier.
2. `npm config get prefix`,找到npm全局包的安装目录;
3. 进入全局目录的`node_modules`,找到刚刚安装的prettier文件夹,复制路径(或者直接上一步的路径拼上`\node_modules\prettier`);
4. 打开设置窗口`ctrl+alt+s`,左上角输入`prettier`,自动定位到`laguages&frameworks-javascript-prettier`配置项.将上一步的路径填入`prettier packages`项,保存即可.

两种方式都可以实现保存即自动格式化.区别在于前者格式化规则是本机webstorm的规则.不会跟随项目,导致格式化规则不一致.
后者的规则是prettier,在有配置的情况下,使用项目的prettier规则.没有配置则是默认的prettier规则.始终一致.