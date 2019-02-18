---
title: 开发一个npm包
abbrlink: 718c
date: 2019-02-18 16:17:20
tags:
- npm
- webpack
- package
categories:
- [技术, npm]
---
搞开发久了,多少会积累一些自己开发的工具包,在项目之间复制来复制去,非常麻烦.如果能用npm管理起来,新项目不用再`ctrl +c +v`,直接`yarn add xx`,那才是坠后滴.
因此今天记录下发布一个npm包的过程.

### 注册npm账号
好像是废话,[npm](https://www.npmjs.com/),请.
经历过几次安全事故后,npm宣布了新规则,建议使用账号或者组织账号作为命名空间,避免坏人起相近的名字干坏事.也可以避免命名冲突(可见人类起名字的能力是有多弱鸡:D)

### 建立项目
先在[github](https://github.com/)建立一个空项目,然后clone到本地.
然后执行`npm init`,创建`package.json`文件.
名字设置为`@npmusername/packagename`,这个名字将是用来install的关键字.
打开package.json,修改main字段,指向你希望暴露出去的文件.
如果希望发布到cdn中,添加unpkg字段,值与main一致.
如
```
```
