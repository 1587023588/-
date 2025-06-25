/* 版权所有 (c) 2017 MIT 6.813/6.831 课程组，保留所有权利。
 * 转载或衍生作品需获得课程组许可。
 */

 /**
 * 该对象表示棋盘上的一颗糖果。糖果具有行列位置和颜色属性
 */

var Candy = function(color, id)
{
 ////////////////////////////////////////////////
 // 表示
 //

 // 两个不可变属性
 Object.defineProperty(this, 'color', {value: color, writable: false});
 Object.defineProperty(this, 'id', {value: id, writable: false});

 // 两个可变属性
 this.row = null;
 this.col = null;

 ////////////////////////////////////////////////
 // 公共方法
 //
 this.toString = function()
 {
   var name = this.color;
   return name;
 }
};

Candy.colors = [
  'red',
  'yellow',
  'green',
  'orange',
  'blue',
  'purple'
];
