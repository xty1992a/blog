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

1. npm包
2. webpack
<!--less-->

搞开发久了,多少会积累一些自己开发的工具包,在项目之间复制来复制去,非常麻烦.如果能用npm管理起来,新项目不用再`ctrl +c +v`,直接`yarn add xx`,那才是坠后滴.
因此今天记录下发布一个npm包的过程.

### 注册npm账号
好像是废话,[npm](https://www.npmjs.com/),请.
经历过几次安全事故后,npm宣布了新规则,建议使用账号或者组织账号作为命名空间,避免坏人起相近的名字干坏事.
这样也可以避免命名冲突~~(可见人类起名字的能力是有多弱鸡:D)~~

### 建立项目
先在[github](https://github.com/)建立一个空项目,然后clone到本地.
然后执行`npm init`,创建`package.json`文件.
名字设置为`@npmusername/packagename`,这个名字将是用来install的关键字.
打开package.json,修改main字段,指向你希望暴露出去的文件.
如果希望发布到cdn中,添加unpkg字段,值与main一致.
如下所示
```json
{
  "main": "lib/package.js",
  "unpkg": "lib/package.js"
}
```
> [unpkg](https://unpkg.com/)是npm的一个cdn网站,配置了unpkg的包将会自动发布到这个网站,我们通过`https://unpkg.com/packagename@version`就可以引用一个npm包,这个包应该是UMD格式的,以便node,浏览器端均可使用

### 写代码
代码自行组织,最终打包到main字段指定的位置即可.建议使用UMD格式.
可以使用rollup或webpack进行打包.以webpack为例,output配置如下
```javascript
output: {
    path: path.resolve(__dirname, '../lib'),
    filename: 'package.js',
    publicPath: '/',
    library: 'Dragger', // 包的命名
    libraryTarget: 'umd',   // 打包格式
    libraryExport: 'default',   // 需要暴露的模块
    umdNamedDefine: true,   // AMD模块配置
}
```
如果没有配置`libraryExport`,在浏览器中直接引用包,打印包名,不能得到你默认暴露的包,而是得到一个对象,上面的default属性才是默认暴露,将`libraryExport`设置为`default`意为将`default`作为包名暴露
{% note %}
比如你如下暴露类库
`export default class MyLibrary {}`
在浏览器打印`MyLibrary`,得到
{
    default: MyLibrary
}
配置`libraryExport`后,
打印`MyLibrary`,得到`MyLibrary`
{% endnote %}

### 添加文档
添加README.md,将安装,使用方式写明.如果有时间,最好附带一个demo.可以使用[codepan](https://codepan.net/)在线写例子.利用上一步发布成功的unpkg的cdn地址引入包.

### 发布
1. 登录`npm login`,依次输入账号密码邮箱
2. 发布`npm publish`,因为是带命名空间的,所以需要加上参数`npm publish --access public`
发布成功之后,如果要升级,需要更改版本号,才能再次发布.
24小时内,可以撤销,使用`npm unpublish packagename`撤销,权限错误加上参数--force.

[示例地址](https://github.com/xty1992a/draggerjs)
[示例类库地址](https://www.npmjs.com/package/@redbuck/draggerjs)
