const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const date = require('date-fns')
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

/////--------------CHECK REQUEST QUERIES-----------------------

const checkRequestQueries = async (request, response, next) => {
  const {search_q, priority, status, category, dueDate} = request.query
  const {todoId} = request.params

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const isPriorityValid = priorityArray.includes(priority)
    if (isPriorityValid) {
      request.category = category
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

/////////////----------------TO DO DETAILS -------------------

const getTodoDetails = dbObj => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.dueDate,
  }
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
        todo LIKE "%${search_q}%"
        AND status LIKE "%${status}%"
        AND priority LIKE "%${priority}%
        AND category LIKE "%${category}%";
    `
  const getTodoArrayResponse = await db.all(getTodoQuery)
  response.send(getTodoArrayResponse.map(eachTodo => getTodoDetails(eachTodo)))
})
module.exports = app
