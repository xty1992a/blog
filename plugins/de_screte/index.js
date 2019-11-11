const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const command = 'git diff --name-status HEAD~2 HEAD~3';
// 获取git改动清单
const getArrList = (str, type) => {
  const arr = str.split('\n');
  return arr.filter(item => {
	const regex = new RegExp(`[${type}].*`);
	if (regex.test(item)) {
	  return item !== undefined;
	}
  });
};

/**
 * @description 获取类型清单
 * @param {*} arr
 * @param {*} type M:修改，D：删除 A：新增
 * @returns
 */
const formatList = (arr, type) => {
  return arr.map(item => {
	return item.replace(/\s/g, '').replace(type, '');
  });
};
exec(command, 'utf8', (err, stdout, stderr) => {
  if (err) {
	console.log('err:', err);
	console.log('stderr:', stderr);
  }
  else {
	console.log(stdout);
	const typeList = ['M', 'D', 'A'];
	const dictList = {
	  'M': '修改',
	  'D': '删除',
	  'A': '新增'
	};
	let arr;
	typeList.forEach(type => {
	  arr = getArrList(stdout, type);
	  arr = formatList(arr, type);
	  console.log(`${dictList[type]}:`, arr);
	});
  }
});
