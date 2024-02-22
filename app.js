const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const date = require('date-fns')
//const toDate = require('date-fns/todate')
const isValid = require('date-fns/isValid')
const format = require('date-fns/format')
const path = require('path')
const app = express()
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

app.use(express.json())

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`Error: ${error.message}`)
  }
}

initializeDBandServer()

////////////--------------------CHECK REQUEST BODY-----------------

const checkRequestBody = async (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params

  if (category !== undefined) {
    categoryArray = ['WORK', 'HOME', 'LEARNING']
    categoryIsInArray = categoryArray.includes(category)

    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const formatedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatedDate)
      const isValidDate = isValid(formatedDate)
      console.log(isValidDate)
      if (isValidDate === true) {
        request.dueDate = formatedDate
      } else {
        response.status(400)
        console.log('DATE IS GETTING NOT COOORRECT')
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      console.log(`error : ${e.message}`)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todo = todo
  request.id = id

  request.todoId = todoId

  next()
}

/////--------------CHECK REQUEST QUERIES-----------------------

const checkRequestQueries = async (request, response, next) => {
  const {search_q, priority, status, category, dueDate} = request.query
  console.log(request.query)
  const {todoId} = request.params

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const isPriorityValid = priorityArray.includes(priority)
    if (isPriorityValid) {
      request.priority = priority
      console.log(request.priority)
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const isStatusValid = statusArray.includes(status)
    if (isStatusValid) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  }

  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const isCategoryValid = categoryArray.includes(category)
    if (isCategoryValid) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      console.log(dueDate)
      console.log(myDate)
      const formatedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatedDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      console.log(result, 'r')
      console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'V')
      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (error) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.todoId = todoId
  request.search_q = search_q

  next()
}


//////////////----------------API 1----------------
app.get('/todos/', checkRequestQueries, async (request, response) => {
  console.log(request.query)
  const {
    search_q = '',
    status = '',
    priority = '',
    category = '',
  } = request.query
  const getTodoQuery = `
    SELECT
        id,
        todo,
        status,
        priority,
        category,
        due_date AS dueDate
    FROM
        todo
    WHERE
        todo LIKE '%${search_q}%'
        AND status LIKE '%${status}%'
        AND priority LIKE '%${priority}%'
        AND category LIKE "%${category}%";
    `
  const getTodoArrayResponse = await db.all(getTodoQuery)
  response.send(getTodoArrayResponse)
})

//////////----------------------API 2----------------------

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  console.log(request.params)
  const getTodoIdQuery = `
  SELECT 
    id,
    todo,
    priority,
    status,
    category,
    due_date AS dueDate
  FROM
    todo
  WHERE
    id = ${todoId};
  `
  const todoIdResponse = await db.get(getTodoIdQuery)
  console.log(todoIdResponse)
  response.send(todoIdResponse)
})

/////////////---------------API 3 ------------------------

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  console.log(date)
  const formatDate = format(new Date(date), 'yyyy-MM-dd')
  const getDueDateTodoQuery = `
  SELECT 
    id,
    todo,
    priority,
    status,
    category,
    due_date AS dueDate
  FROM
    todo
  WHERE
    due_date = '${formatDate}';
  `
  const todoResponseArray = await db.all(getDueDateTodoQuery)
  if (todoResponseArray === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(todoResponseArray)
  }
})

//////////--------------------------API 4 ----------------------

app.post('/todos/',checkRequestBody, async (request, response) => {
  const {todoId, todo, priority, status, category, dueDate} = request.body
  console.log(request.body)
  const postTodoQuery = `
  INSERT INTO 
    todo (id, todo, priority, status, category, due_date)
  VALUES
    (${todoId}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');
  `
  await db.run(postTodoQuery)
  console.log("added")
  response.send('Todo Successfully Added')
})

///////----------------API 5-----------------------

app.put('/todos/:todoId/',checkRequestBody, async (request, response) => {
  console.log(request.body)
  const {todoId} = request.params
  const {todo, priority, status, category, dueDate} = request.body
  let responseStatus = null
  let updatedTodoQuery = null
  switch (true) {
    case status !== undefined:
      updatedTodoQuery = `
      UPDATE 
        todo
      SET
        status = '${status}'
      WHERE
        id = ${todoId};
      `
      responseStatus = 'Status Updated'
      break
    case priority !== undefined:
      updatedTodoQuery = `
      UPDATE 
        todo
      SET
        priority = '${priority}'
      WHERE
        id = ${todoId};
      `
      responseStatus = 'Priority Updated'
      break
    case category !== undefined:
      updatedTodoQuery = `
      UPDATE 
        todo
      SET
        category = '${category}'
      WHERE
        id = ${todoId};
      `
      responseStatus = 'Category Updated'
      break
    case dueDate !== undefined:
      const formatDate = format(new Date(dueDate), 'yyyy-MM-dd')
      updatedTodoQuery = `
      UPDATE 
        todo
      SET
        due_date = '${formatDate}'AS dueDate
      WHERE 
        id = ${todoId};
      `
      responseStatus = 'Due Date Updated'
      break
    default:
      updatedTodoQuery = `
      UPDATE 
        todo
      SET
        todo = '${todo}'
      WHERE
        id = ${todoId};
      `
      responseStatus = 'Todo Updated'
      break
  }
  await db.run(updatedTodoQuery)
  response.send(responseStatus)
})

//////----------------API 6----------------------------------

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};
  `
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
