/* 版权所有 (c) 2017 MIT 6.813/6.831 课程组，保留所有权利。
 * 转载或衍生作品需获得课程组许可。
 */

 /*
 *
 * 这个类实现了糖果传奇的规则。
 *
 */
var Rules = function(board)
{
  // 在设置期间设置，以避免计分。
  var scoring = false;

  ////////////////////////////////////////////////
  // 公共方法
  // 
  // 你可能会在 index.html 中调用这些方法
  //

  /*
  *
  * 准备一个新游戏，确保没有三个相邻的相同颜色的糖果组。
  * 任何时候有相邻的相同颜色糖果组，就重新生成它们。
  * 将分数设置为零，以便玩家不会因为初始
  * 的幸运消除而获得积分。
  *
  */
  this.prepareNewGame = function()
  {
    scoring = false;
    while (true)
    {
      this.populateBoard()
      var crushable = this.getCandyCrushes();
      if (crushable.length == 0) break;
      this.removeCrushes(crushable);
    }
    scoring = true;
  }


  /*
  *
  * 如果将 fromCandy 与指定方向
  * （['up', 'down', 'left', 'right']）的糖果交换是有效的
  * （根据规则），则返回 true，否则返回 false。
  *
  */
  this.isMoveTypeValid = function(fromCandy, direction)
  {
    return this.numberCandiesCrushedByMove(fromCandy, direction) > 0;
  }
  
  /*
  *
  * 返回棋盘上所有的糖果消除情况。糖果消除是指
  * 一行或一列中三个或更多相同颜色糖果的集合。每个消除情况以被
  * 消除的糖果列表形式提供，结果是一个列表的列表。该方法的输出应
  * 直接传递给 this.removeCrushes 以移除糖果消除。
  * 
  */
 //返回单行/列能够被压碎的糖果集合
  this.getCandyCrushes = function(swap) {
    // 使用（未完全优化的）Tarjan的并查集算法实现。
    // 经典并查集算法的实现（未优化）。
    // 允许任何字符串键合并为不相交集合。
    // https://en.wikipedia.org/wiki/Disjoint-set_data_structure
    var unioned = {};
    var sizes = {};
    var row, col;
    // 查找此键所属集合的代表元素。
    function find(key)
    {
      var parent = unioned[key];
      if (parent == null) return key;
      parent = find(parent);
      unioned[key] = parent;  // 路径压缩
      return parent;
    }
    // 'found'代表的集合的大小；如果未存储，则假设为1。
    function size(found)
    {
      return sizes[found] || 1;
    }
    // 确保两个键在同一个集合中，如果需要则合并。
    function union(key1, key2)
    {
      var p1 = find(key1), p2 = find(key2);
      if (p1 == p2) return p1;
      // 不必实现按秩合并。这样也相当快。
      // 注意，http://stackoverflow.com/a/2326676/265298
      unioned[p2] = p1;
      sizes[p1] = size(p1) + size(p2);
      delete sizes[p2];
    }
    // 获取长度为3的条带。
    var vert = this.findColorStrips(true, swap);    //垂直方向上颜色相同的糖果
    var horiz = this.findColorStrips(false, swap); //水平方向上颜色相同的糖果
    var sets = vert.concat(horiz); //聚合两个方向
	
    // 执行所有条带的合并，可能连接
    // 相交的水平和垂直条带。
    for (var j = 0; j < sets.length; j++)
    {
      var set = sets[j];
      for (var k = 1; k < set.length; k++)
      {
        union(set[0].id, set[k].id)
      }
    }

    // 第二次遍历：列出大小为minSize或更大的结果集。
    var results = {}
    for (row = 0; row < board.boardSize; row++)
    {
      for (col = 0; col < board.boardSize; col++)
      {
        var candy = board.getCandyAt(row, col);
        if (candy)
        {
          var p = find(candy.id);
          if (size(p) >= 3)
          {
            if (!(p in results)) results[p] = [];
            results[p].push(candy);
          }
        }
      }
    }
    // 第三次遍历：将结果作为糖果列表的列表返回。
    var list = [];
    for (var key in results)
    {
      list.push(results[key]);
    }
    return list;
  }


  /*
  *
  * 删除 setOfSetsOfCrushes 中的所有糖果（可以由
  * getCandyCrushes 或 getCandiesToCrushGivenMove 生成）。
  * 不会将糖果下移。相应地更新分数。
  *
  */
 //根据返回的糖果集合移除能够消除的糖果
  this.removeCrushes = function(setOfSetsOfCrushes,flag)
  {
    for (var j = 0; j < setOfSetsOfCrushes.length; j++)
    {
      var set = setOfSetsOfCrushes[j];
      for (var k = 0; k < set.length; k++)
      {
		  
        if (scoring) board.incrementScore(set[k], set[k].row, set[k].col); //增加分数
        board.remove(set[k],flag);
      }
    }
  }

  /*
  *
  * 将糖果下移，直到没有空格。调用
  * board.moveTo，生成要监听的"move"事件。如果
  * 由于糖果下移而创建了空洞，则用随机
  * 糖果填充这些空洞，并为这些糖果发出"add"事件。
  * 压碎后会检查整个棋盘上空的糖果，向下移动后再随机填充新的糖果
  */
  this.moveCandiesDown = function()
  {
    // 压缩每一列 从左往右，从底向上
    for (var col = 0; col < board.boardSize; col++)
    {
      var emptyRow = null;
      // 在每列中，扫描最底部的空行
      for (var emptyRow = board.boardSize - 1; emptyRow >= 0; emptyRow--)
      {
        if (board.getCandyAt(emptyRow, col) == null) //判断是否为空
        {
          break;
        }
      }
      // 然后将任何非空行上移 向下滑动
      for (var row = emptyRow - 1; row >= 0; row--)
      {
        var candy = board.getCandyAt(row, col);
        if (candy != null)
        {
          board.moveTo(candy, emptyRow, col);
          emptyRow--;
        }
      }

      for (var spawnRow = -1; emptyRow >= 0; emptyRow--, spawnRow--)
      {
        // 我们报告 spawnRow 为糖果"本来应该"
        // 开始落下的（负）位置。
        board.addRandomCandy(emptyRow, col, spawnRow, col); //填充第一行
		
      }
      
    }
  }


  /*
  *
  *  如果有有效的移动，则返回具有两个属性的对象：
  *  candy: 可以移动的糖果
  *  direction: 可以移动的方向。
  *  如果没有有效的移动，则返回 null。移动是从可用移动中
  *  随机选择的，偏向于较小的消除。
  *
  */
 //移动提示，判断如何移动能够进行消除
  this.getRandomValidMove = function()
  {
    var directions = ['up', 'down', 'left', 'right'];
    var validMovesThreeCrush = [];
    var validMovesMoreThanThreeCrush = [];

    // 对于棋盘上的每个单元格，检查朝任意四个方向
    // 移动它是否会导致消除
    // 如果是，则将其添加到适当的列表中（validMoves_threeCrush 用于
    // 3个一组的消除，validMoves_moreThanThreeCrush 用于
    // 大于3个一组的消除）
	
    for (var row = 0; row < board.boardSize; row++)
    {
      for (var col = 0; col < board.boardSize; col++) //遍历所有的糖果
      {
        var fromCandy = board.getCandyAt(row,col);
        if (!fromCandy) continue;
        for (i = 0; i < 4; i++)
        {
          var direction = directions[i];
          var numCandiesCrushed =
              this.numberCandiesCrushedByMove(fromCandy, direction);
			
          if (numCandiesCrushed == 3) //数量等于3
          {
            validMovesThreeCrush.push({candy: fromCandy, direction: direction});
          }
          else if (numCandiesCrushed > 3) //数量大于3
          {
            validMovesMoreThanThreeCrush.push(
                {candy: fromCandy, direction: direction});
          }
        }
      }
    }
    // if there are three-crushes possible, prioritize these
    var searchArray = validMovesThreeCrush.length ? validMovesThreeCrush :
      validMovesMoreThanThreeCrush; //返回其中一个数组
    // If there are no valid moves, return null.
    if (searchArray.length == 0) return null; //如果找不到移动后能消除的返回null
    // select a random crush from among the crushes found]
	
    return searchArray[Math.floor(Math.random() * searchArray.length)]; //返回能够消除的数组中随机一个元素
  }


  ////////////////////////////////////////////////
  // USEFUL FOR DEBUGGING
  // 
  //

  /*
  *
  *  Specify a board configuration by passing in a boardSpec. The format
  *  of boardSpec is a list of strings, one sequence for each row. In each
  *  string, there must be boardSize characters, where each character should
  *  be the first letter of the color for that square. For example, a boardSpec
  *  that specifies an 8x8 board with alternating columns of red and orange would have
  *  a boardSpec of:
  *  ['rorororo', 
  *  'rorororo', 
  *  'rorororo', 
  *  'rorororo', 
  *  'rorororo', 
  *  'rorororo',
  *  'rorororo', 
  *  'rorororo']
  *
  */
  this.createSpecifiedBoard = function(boardSpec) {

    color_dict = {'r':'red', 'o':'orange', 'y':'yellow', 'g':'green','b':'blue','p':'purple'}

    var numChars=0;

    boardSpec.map(function (i) { return numChars+=i.length });
    if (boardSpec.length != board.boardSize || numChars != Math.pow(board.boardSize,2)){
      console.warn("boardSpec must be of dimensions boardSize x boardSize to populate board");
      return;
    }

    for (var col = 0; col < board.boardSize; col++)
    {
      for (var row = 0; row < board.boardSize; row++)
      {
        if (board.getCandyAt(row, col) == null)
        {
           var color = color_dict[boardSpec[row].charAt(col)];
           board.addCandy(color, row, col);
        }
      }
    }

  }


  ////////////////////////////////////////////////
  // Private methods 
  //
  // You likely do NOT need to call these methods
  //


  /*
  *  Helper method to rules.prepareNewGame
  *  Called when a new game is created. Fills all the empty positions on 
  *  the board with random-colored candies.
  *
  */
  this.populateBoard = function()
  {
    for (var col = 0; col < board.boardSize; col++)
    {
      for (var row = 0; row < board.boardSize; row++)
      {
        // Check the empty candy position (hole), fill with new candy
        if (board.getCandyAt(row, col) == null)
        {
          board.addRandomCandy(row, col);
        }
      }
    }
  }


  /*
  *
  *  Helper method for rules.isMoveTypeValid
  *  Returns the number of candies that would be crushed if the candy
  *  provided by fromCandy were to be flipped in the direction
  *  specified (['up', 'down', 'left', 'right'])
  * 
  *  If this move is not valid (based on the game rules), then 0 is returned
  * 
  */
  this.numberCandiesCrushedByMove = function(fromCandy, direction)
  {
    return this.getCandiesToCrushGivenMove(fromCandy, direction).length; //返回移动后能够消除糖果的数量
  }

  /*
  *
  *  Helper method for rules.numberCandiesCrushedByMove
  *  Returns a list of candies that would be "crushed" (i.e. removed) if
  *  fromCandy were to be moved in the direction specified by direction (['up',
  *  'down', 'left', 'right'])
  *  If move would result in no crushed candies, an empty list is returned.
  *
  */
  this.getCandiesToCrushGivenMove = function(fromCandy, direction)
  {
    var toCandy = board.getCandyInDirection(fromCandy, direction); //返回移动后的糖果
    if (!toCandy || toCandy.color == fromCandy.color) //无法移动（边界），移动前后两个颜色相同，返回空集合
    {
      return [];
    }
    var swap = [fromCandy, toCandy];
    var crushable = this.getCandyCrushes(swap);
    // Only return crushable groups that involve the swapped candies.
    // If the board has incompletely-resolved crushes, there can be
    // many crushable candies that are not touching the swapped ones.
    var connected = crushable.filter(function(set) //筛选包含可消除糖果列表是否包含移动后元素的
    {
      for (var k = 0; k < swap.length; k++)
      {
        if (set.indexOf(swap[k]) >= 0) return true;
      }
      return false;
    });
    
    return [].concat.apply([], connected); //flatten nested lists 筛选出所有至少与swap数组中的一个元素有交集的集合并返回
  }


  /*
  *
  *  Helper Method for rules.getCandyCrushes
  *  Returns a set of sets of all the same-color candy strips of length
  *  at least 3 on the board.  If 'vertical' is set to true, looks only for
  *  vertical strips; otherwise only horizontal ones. If the 'swap' array
  *  is passed, then every even-indexed candy in the array is considered
  *  swapped with every odd-indexed candy in the array.
  *
  */
  this.findColorStrips = function(vertical, swap) {
    var getAt = function(x, y)
    {
      // Retrieve the candy at a row and column (depending on vertical)
      var result = vertical ? board.getCandyAt(y, x) : board.getCandyAt(x, y); 
      if (swap) //当swap参数存在时，判断swap中的元素是否在result中存在
      {
        // If the result candy is in the 'swap' array, then swap the
        // result with its adjacent pair.
        var index = swap.indexOf(result);
        if (index >= 0) return swap[index ^ 1];
      }
      return result; //返回糖果
    };
	//
    var result = [];
    for (var j = 0; j < board.boardSize; j++)
    {
      for (var h, k = 0; k < board.boardSize; k = h)
      {
        // Scan for rows of same-colored candy starting at k
        var firstCandy = getAt(j, k);
        h = k + 1;
        if (!firstCandy) continue;
        var candies = [firstCandy];
        for (; h < board.boardSize; h++)
        {
          var lastCandy = getAt(j, h);
          if (!lastCandy || lastCandy.color != firstCandy.color) break;
          candies.push(lastCandy);
        }
        // If there are at least 3 candies in a row, remember the set.
        if (candies.length >= 3) result.push(candies);
      }
    }
    return result;
  }


}
