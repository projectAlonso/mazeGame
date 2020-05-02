// SETUP CODE

const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 14;
const cellsVertical = 10;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal; // Cells width
const unitLengthY = height / cellsVertical; // Cells height

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height
  }
});
Render.run(render);
Runner.run(Runner.create(), engine);


// OUTSIDE WALLS / CANVAS

const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];
World.add(world, walls);


// MAZE GENERATION

// Shuffle function

const shuffle = arr => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);

    counter--;

    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

//Generation of a grid that serves as a template for the maze
const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));


// ALGORITHM TO GENERATE THE MAZE

// Random cell to start counting on the generation
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {

  // If I have already visted the cell at [row, column], then return
  if (grid[row][column]) {
    return;
  }

  // Mark this cell as visited
  grid[row][column] = true;

  // Generate a random list of neighbor cells
  const neighbors = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left']
  ]);

  // For each neighbor....
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;

    // See if that neighbor is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue;
    }

    // If we have visited that neighbor, continue to next neighbor
    if (grid[nextRow][nextColumn]) {
      continue;
    }

    // Remove a wall from either horizontals or verticals
    if (direction === 'left') {
      verticals[row][column - 1] = true;
    } else if (direction === 'right') {
      verticals[row][column] = true;
    } else if (direction === 'up') {
      horizontals[row - 1][column] = true;
    } else if (direction === 'down') {
      horizontals[row][column] = true;
    }

    stepThroughCell(nextRow, nextColumn); // Recursion (to make sure we do not end up with unvisited cells)
  }
};

// Visit the next cell
stepThroughCell(startRow, startColumn);

// END OF THE ALGORITHM


// Draw the walls of the maze

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2, // Center of the wall at 'X' axis
      rowIndex * unitLengthY + unitLengthY, // Center of the wall at 'Y' axis
      unitLengthX, // Width of the wall
      5, // Height of the wall
      { // Options
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: 'teal'
        }
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX, // X axis
      rowIndex * unitLengthY + unitLengthY / 2,  // Y axis
      5, // Width
      unitLengthY,  // Height
      { // Options
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: 'teal'
        }
      }
    );
    World.add(world, wall);
  });
});

// Drawing the goal

const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    label: 'goal',
    isStatic: true,
    render: {
      fillStyle: 'green'
    }
  }
);
World.add(world, goal);

// Drawing the player's ball

const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: 'ball',
  render: {
    fillStyle: 'lightblue'
  }
});
World.add(world, ball);


// MOVEMENT LOGIC

document.addEventListener('keyup', event => {
  const { x, y } = ball.velocity;

  document.querySelector('.intro').classList.add('hidden');

  if (event.keyCode === 87) { 
    Body.setVelocity(ball, { x, y: y - 5 }); // Move up
  }

  if (event.keyCode === 68) {
    Body.setVelocity(ball, { x: x + 5, y }); // Move right
  }

  if (event.keyCode === 83) {
    Body.setVelocity(ball, { x, y: y + 5 }); // Move down
  }

  if (event.keyCode === 65) {
    Body.setVelocity(ball, { x: x - 5, y }); // Move left
  }
});


// WIN CONDITION

Events.on(engine, 'collisionStart', event => {
  event.pairs.forEach(collision => {
    const labels = ['ball', 'goal'];

    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
        document.querySelector('.winner').classList.remove('hidden');
        world.gravity.y = 1;
        world.bodies.forEach(body => {
            if (body.label === 'wall') {
            Body.setStatic(body, false);
            }
      });
    }
  });
});
