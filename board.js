/* 版权所有 (c) 2017 MIT 6.813/6.831 课程组，保留所有权利。
 * 转载或衍生作品需获得课程组许可。
 */

/**
 * Board 表示糖果棋盘的状态。糖果棋盘是一个正方形的方格阵列。
 * 糖果棋盘可以是任意大小。
 *
 * 棋盘上的每个方格包含一颗糖果。
 * 每个方格由其行和列标识，从 0 到 size-1 编号。
 * 方格 [0,0] 位于糖果棋盘的左上角。
 * 行向下编号，列向右编号。
 * 每个方格上的糖果类型是随机的。
 * 
 * 糖果是可变的：可以添加、删除和移动糖果。
 * （然而，棋盘的大小是不可变的。）
 * 
 * 棋盘广播四种事件类型："add"（添加）、
 * "remove"（移除）、"move"（移动）和 "scoreUpdate"（分数更新）。
 */

var Board = function(size)
{
  // 每个糖果的唯一ID
  var candyCounter = 0;

  // 分数，每消除一颗糖果得一分
  this.score = 0;

  // boardSize 是糖果棋盘一边的方格数
  this.boardSize = size;

  // square 是表示糖果棋盘的二维数组
  // square[row][col] 是该方格中的糖果，如果方格为空则为 null
  this.square = new Array(this.boardSize);
  // 创建一个空的糖果棋盘
  for (var i = 0; i < this.boardSize; i++)
  {
    this.square[i] = [];
  }

  /*
   * 根据行和列是否标识棋盘上的有效方格，
   * 返回 true/false。
   */
  this.isValidLocation = function(row, col)
  {
    return (row >= 0 && col >= 0 &&
            row < this.boardSize && col < this.boardSize &&
            row == Math.round(row) && col == Math.round(col));
  }

  /*
   * 返回 true/false，取决于 [row,col] 处的方格
   * 是否为空（不包含糖果）。
   */
  this.isEmptyLocation = function(row, col)
  {
    if (this.getCandyAt(row, col)) {
      return false;
    }
    return true;
  }

  ////////////////////////////////////////////////
  // 公共方法
  //

  /* 
  * 在棋盘上自动执行有效的移动。翻转
  * 适当的糖果，但不消除糖果。
  */
  this.doAutoMove = function() {
    var move = rules.getRandomValidMove();
    var toCandy = board.getCandyInDirection(move.candy, move.direction);
    this.flipCandies(move.candy,toCandy);
  }


  /*
   * 返回棋盘每一边的方格数
   */
  this.getSize = function()
  {
    return this.boardSize;
  }

  /**
   * 获取 [row,column] 处方格中的糖果，如果该方格为空，则返回 null。
   * 要求 row,column < size。
   */
  this.getCandyAt = function(row, col)
  {
    if (this.isValidLocation(row,col))
    {
      return this.square[row][col];
    }
  }

  /**
   * 获取糖果的位置（行和列），如果在此
   * 棋盘上找到，则返回该位置；如果未找到，则返回 null。
   */
  this.getLocationOf  = function(candy){
    return {row:candy.row, col:candy.col};
  }

  /**
   * 获取棋盘上所有糖果的列表，顺序无关。
   */
  this.getAllCandies = function(){
    var results = [];
    for (var r in this.square) {
      for (var c in this.square[r]) {
        if (this.square[r][c]) {
         results.push(this.square[r][c]);
        }
      }
    }
    return results;
  }



  /*
  * 将新糖果添加到棋盘。要求糖果当前不在棋盘上，
  * 且 (row,col) 必须指定一个有效的空方格。
  *
  * 可选的 spawnRow, spawnCol 指示糖果
  * 在移动到 row, col 之前的"生成"位置。此位置，
  * 可能在棋盘外，将被添加到"添加"事件中，
  * 可用于动画效果，显示新糖果从屏幕外出现。
  */
  this.add = function(candy, row, col, spawnRow, spawnCol)
  {
    if (this.isEmptyLocation(row, col))
    {
      var details = {
        candy: candy,
        toRow: row,
        toCol: col,
        fromRow: spawnRow,
        fromCol: spawnCol
      };

      candy.row = row;
      candy.col = col;

      this.square[row][col] = candy;

      $(this).triggerHandler("add", details);
    }
    else
    {
      console.log("add already found a candy at " + row + "," + col);
    }
  }

  /**
  * 将糖果从其当前位置移动到另一个方格。
  * 要求糖果已在此棋盘上，且 (toRow,toCol)
  * 必须表示一个有效的空方格。
  */
  this.moveTo = function(candy, toRow, toCol)
  {
    if (this.isEmptyLocation(toRow,toCol))
    {
      var details = {
        candy:candy,
        toRow:toRow,
        toCol:toCol,
        fromRow:candy.row,
        fromCol:candy.col};

      delete this.square[candy.row][candy.col];
      this.square[toRow][toCol] = candy;

      candy.row = toRow;
      candy.col = toCol;

      $(this).triggerHandler("move", details);
    }
  }

  /**
  * 从棋盘上移除糖果。
  * 要求糖果在此棋盘上存在。
  */
  this.remove = function(candy)
  {
    var details = {
      candy: candy,
      fromRow: candy.row,
      fromCol: candy.col
    };
    delete this.square[candy.row][candy.col];
    candy.row = candy.col = null;
    $(this).triggerHandler("remove", details);
  }

  /**
  * 移除此棋盘上给定位置的糖果。
  * 要求糖果在此棋盘上存在。
  */
  this.removeAt = function(row, col)
  {
    if (this.isEmptyLocation(row, col))
    {
      console.log("removeAt found no candy at " + row + "," + col);
    }
    else
    {
      this.remove(this.square[row][col]);
    }
  }


  /**
  * 移除棋盘上的所有糖果。
  */
  this.clear = function() {
    for (var r in this.square)
    {
      for (var c in this.square[r])
      {
        if (this.square[r][c])
        {
          this.removeAt(r, c);
        }
      }
    }
  }


  ////////////////////////////////////////////////
  // 工具
  //

  /*
  在指定的行和列添加指定颜色的糖果。 
  */
  this.addCandy = function(color, row, col, spawnRow, spawnCol)
  {
    var candy = new Candy(color, candyCounter++);
    this.add(candy, row, col, spawnRow, spawnCol);
  }

  /**
  * 在指定的行和列添加随机颜色的糖果。
  */
  this.addRandomCandy = function(row, col, spawnRow, spawnCol)
  {
	Math.seedrandom() //添加随机种子
    var random_color = Math.floor(Math.random() * Candy.colors.length);
    var candy = new Candy(Candy.colors[random_color], candyCounter++);
    this.add(candy, row, col, spawnRow, spawnCol);
  }

  /*
  返回从 fromCandy 处开始，朝指定方向
  ['up', 'down', 'left', 'right'] 的糖果
  */
  this.getCandyInDirection = function(fromCandy, direction)
  {
    switch(direction)
    {
      case "up":  {
        return this.getCandyAt(fromCandy.row-1, fromCandy.col);
      }
      case "down": {
        return this.getCandyAt(fromCandy.row+1, fromCandy.col);
      }
      case "left": {
        return this.getCandyAt(fromCandy.row, fromCandy.col-1);
      }
      case "right": {
        return this.getCandyAt(fromCandy.row, fromCandy.col+1);
      }
    }
  }


  /* 在一步中交换 candy1 和 candy2，触发两个移动事件。
   * 不验证翻转的有效性。不消除因翻转而产生的糖果。 */
  this.flipCandies = function(candy1, candy2)
  {
    // 同时交换两个糖果。
    var details1 = {
      candy: candy1,
      toRow: candy2.row,
      toCol: candy2.col,
      fromRow: candy1.row,
      fromCol: candy1.col
    };
    var details2 = {
      candy: candy2,
      toRow: candy1.row,
      toCol: candy1.col,
      fromRow: candy2.row,
      fromCol: candy2.col
    };
    candy1.row = details1.toRow;
    candy1.col = details1.toCol;
    this.square[details1.toRow][details1.toCol] = candy1;
    candy2.row = details2.toRow;
    candy2.col = details2.toCol;
    this.square[details2.toRow][details2.toCol] = candy2;

    // 触发两个移动事件。
    $(this).triggerHandler("move", details1);
    $(this).triggerHandler("move", details2);
  }

  /*
  * 重置分数
  */
  this.resetScore = function() {
    this.score = 0;
    $(this).triggerHandler("scoreUpdate", [{score: 0}]);
  }

  /*
   * 增加分数。
   */
  this.incrementScore = function(candy, row, col) {
    this.score += 1;
    $(this).triggerHandler("scoreUpdate", [{
      score: this.score,
      candy: candy,
      row: row,
      col: col
    }]);
  }

  /*
   * 获取当前分数
   */
  this.getScore = function() {
    return this.score
  }



  /**
   * 获取棋盘的字符串表示，格式为多行矩阵。
   */
  this.toString = function()
  {
    var result = "";
    for (var r = 0; r < this.boardSize; ++r) {
      for (var c = 0; c < this.boardSize; ++c) {
        var candy = this.square[r][c];
        if (candy) {
         result += candy.toString().charAt(0) + " ";
        }else {
         result += "_ ";
        }
      }
      result += "<br/>";
    }
    return result.toString();
  }
}
