import { findNeighbors } from '../config';


const heuristic = {

  // standard
  manhattan: (node, goal) => Math.abs(node.row - goal.row) + Math.abs(node.col - goal.col),

  // if diagonal search is considered
  diagonalChebyshev: (node, goal) => {
    const D = 1;
    const D2 = 1;
    const dx = Math.abs(node.row - goal.row);
    const dy = Math.abs(node.col - goal.col);
    return (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
  },

  // if diagonal search is considered
  diagonalOctile: (node, goal) => {
    const D = 1;
    const D2 = Math.sqrt(2);
    const dx = Math.abs(node.row - goal.row);
    const dy = Math.abs(node.col - goal.col);
    return (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
  },

  // not recommended because it will took longer A* search
  euclidean: (node, goal) => {
    const dx = Math.abs(node.row - goal.row);
    const dy = Math.abs(node.col - goal.col);
    return Math.sqrt(dx * dx + dy * dy);
  },

  // recommended if you plan to use euclidean
  euclideanSquared: (node, goal) => {
    const dx = Math.abs(node.row - goal.row);
    const dy = Math.abs(node.col - goal.col);
    return  dx * dx + dy * dy;
  }
}

const bestfirstsearch = (grid, start, finish, selectedHeuristic, isDiagonal) => {
  let closest = false;

  var openHeap = getHeap();
  var closestNode = start;
  var visited = [];

  start.h = heuristic[selectedHeuristic](start, finish);

  openHeap.push(start);
  visited.push(start);
  


  while(openHeap.size() > 0) {

    // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
    const currentNode = openHeap.pop();

    // End case -- result has been found, return the traced path.
    if (currentNode === finish) {
      return visited;
    }

    // Normal case -- move currentNode from open to closed, process each of its neighbors.
    currentNode.closed = true;

    // Find all neighbors for the current node.
    const neighbors = findNeighbors(grid, currentNode.row, currentNode.col, isDiagonal);

    for (const neighbor of neighbors) {
      if (neighbor.closed || neighbor.isWall) {
        continue;
      }

      // The g score is the shortest distance from start to current node.
      // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
      // const gScore = currentNode.g + 1;
      const beenVisited = neighbor.isVisited;
    
      if (!beenVisited /* || gScore < neighbor.g */) {
        // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
        visited.push(neighbor);
        neighbor.isVisited = true;
        neighbor.previousNode = currentNode;
        neighbor.h = neighbor.h || heuristic.manhattan(neighbor, finish);
        // neighbor.g = gScore;
        neighbor.f = /*neighbor.g*/ + neighbor.h;
        if (closest) {
          // If the neighbour is closer than the current closestNode or if it's equally close but has
          // a cheaper path than the current closest node then it becomes the closest node
          if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h /*&& neighbor.g < closestNode.g*/)  ) {
            closestNode = neighbor
          }
        }

        if (!beenVisited) {
          // Pushing to heap will put it in proper place based on the 'f' value.
          openHeap.push(neighbor);
        } else {
          // Already seen the node, but since it has been rescored we need to reorder it in the heap
          openHeap.rescoreElement(neighbor);
        }
      }
    }
  }
}

function getHeap() {
  return new BinaryHeap(function(node) {
      return node.f;
  });
}

function BinaryHeap(scoreFunction) {
  this.content = [];
  this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
  push: function(element) {
    // Add the new element to the end of the array.
    this.content.push(element);

    // Allow it to sink down.
    this.sinkDown(this.content.length - 1);
  },
  pop: function() {
    // Store the first element so we can return it later.
    var result = this.content[0];
    // Get the element at the end of the array.
    var end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it bubble up.
    if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
    }
    return result;
  },
  remove: function(node) {
    var i = this.content.indexOf(node);

    // When it is found, the process seen in 'pop' is repeated
    // to fill up the hole.
    var end = this.content.pop();

    if (i !== this.content.length - 1) {
      this.content[i] = end;

      if (this.scoreFunction(end) < this.scoreFunction(node)) {
        this.sinkDown(i);
      } else {
        this.bubbleUp(i);
      }
    }
  },
  size: function() {
    return this.content.length;
  },
  rescoreElement: function(node) {
    this.sinkDown(this.content.indexOf(node));
  },
  sinkDown: function(n) {
    // Fetch the element that has to be sunk.
    var element = this.content[n];

    // When at 0, an element can not sink any further.
    while (n > 0) {

      // Compute the parent element's index, and fetch it.
      var parentN = ((n + 1) >> 1) - 1;
      var parent = this.content[parentN];
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
      this.content[parentN] = element;
      this.content[n] = parent;
      // Update 'n' to continue at the new position.
      n = parentN;
      }
      // Found a parent that is less, no need to sink any further.
      else {
      break;
      }
    }
  },
  bubbleUp: function(n) {
    // Look up the target element and its score.
    var length = this.content.length;
    var element = this.content[n];
    var elemScore = this.scoreFunction(element);

    while (true) {
      // Compute the indices of the child elements.
      var child2N = (n + 1) << 1;
      var child1N = child2N - 1;
      // This is used to store the new position of the element, if any.
      var swap = null;
      var child1Score;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.content[child1N];
        child1Score = this.scoreFunction(child1);

        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore) {
          swap = child1N;
        }
      }



      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.content[child2N];
        var child2Score = this.scoreFunction(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }
      


      // If the element needs to be moved, swap it, and continue.
      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
      // Otherwise, we are done.
      else {
        break;
      }
    }
  }
}

export {
  bestfirstsearch
};

