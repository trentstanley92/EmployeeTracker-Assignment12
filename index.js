const mysql = require('mysql2');
const inquirer = require('inquirer');

// create a connection to the MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'rootroot',
  database: 'company_db'
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    // runs the app
    startPrompt();
});

// start the application
function startPrompt() {
  inquirer.prompt({
    name: 'action',
    type: 'list',
    message: 'What would you like to do?',
    choices: [
      'View all departments',
      'View all roles',
      'View all employees',
      'Add a department',
      'Add a role',
      'Add an employee',
      'Update an employee role',
      'Exit'
    ]
  }).then(answer => {
    switch (answer.action) {
      case 'View all departments':
        viewDepartments();
        break;
      case 'View all roles':
        viewRoles();
        break;
      case 'View all employees':
        viewEmployees();
        break;
      case 'Add a department':
        addDepartment();
        break;
      case 'Add a role':
        addRole();
        break;
      case 'Add an employee':
        addEmployee();
        break;
      case 'Update an employee role':
        updateEmployeeRole();
        break;
      case 'Exit':
        connection.end();
        break;
    }
  });
}


  

// add an employee
function addEmployee() {
    connection.query('SELECT * FROM roles', (err, roles) => {
      if (err) throw err;
      connection.query('SELECT * FROM employees', (err, employees) => {
        if (err) throw err;
        inquirer.prompt([{
            name: 'first_name',
            type: 'input',
            message: 'Enter the employee\'s first name:'
          },
          {
            name: 'last_name',
            type: 'input',
            message: 'Enter the employee\'s last name:'
          },
          {
            name: 'role',
            type: 'list',
            message: 'Choose the employee\'s role:',
            choices: roles.map(role => role.title)
          },
          {
            name: 'manager',
            type: 'list',
            message: 'Choose the employee\'s manager:',
            choices: employees.map(employee => `${employee.first_name} ${employee.last_name}`)
          }
        ]).then(answer => {
          const role = roles.find(role => role.title === answer.role);
          const manager = employees.find(employee => `${employee.first_name} ${employee.last_name}` === answer.manager);
          connection.query('INSERT INTO employees SET ?', {
            first_name: answer.first_name,
            last_name: answer.last_name,
            role_id: role.id,
            manager_id: manager.id
          }, (err, res) => {
            if (err) throw err;
            console.log(`${res.affectedRows} employee added!\n`);
            startPrompt();
          });
        });
      });
    });
  }
  
  // update an employee role
  function updateEmployeeRole() {
    connection.query('SELECT * FROM employees', (err, employees) => {
      if (err) throw err;
      connection.query('SELECT * FROM roles', (err, roles) => {
        if (err) throw err;
        inquirer.prompt([{
            name: 'employee',
            type: 'list',
            message: 'Choose the employee you want to update:',
            choices: employees.map(employee => `${employee.first_name} ${employee.last_name}`)
          },
          {
            name: 'role',
            type: 'list',
            message: 'Choose the employee\'s new role:',
            choices: roles.map(role => role.title)
          }
        ]).then(answer => {
          const employee = employees.find(employee => `${employee.first_name} ${employee.last_name}` === answer.employee);
          const role = roles.find(role => role.title === answer.role);
          connection.query('UPDATE employees SET ? WHERE ?', [{
            role_id: role.id
          }, {
            id: employee.id
          }], (err, res) => {
            if (err) throw err;
            console.log(`${res.affectedRows} employee updated!\n`);
            startPrompt();
          });
        });
      });
    });
  }

// view all departments
function viewDepartments() {
  connection.query('SELECT * FROM departments', (err, res) => {
    if (err) throw err;
    console.table(res);
    startPrompt();
  });
}

// view all roles
function viewRoles() {
  const query = 'SELECT roles.id, roles.title, departments.name AS department, roles.salary FROM roles JOIN departments ON roles.department_id = departments.id';
  connection.query(query, (err, res) => {
    if (err) throw err;
    console.table(res);
    startPrompt();
  });
}

// view all employees
function viewEmployees() {
  const query = 'SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.name AS department, roles.salary, CONCAT(managers.first_name, " ", managers.last_name) AS manager FROM employees JOIN roles ON employees.role_id = roles.id JOIN departments ON roles.department_id = departments.id LEFT JOIN employees AS managers ON employees.manager_id = managers.id';
  connection.query(query, (err, res) => {
    if (err) throw err;
    console.table(res);
    startPrompt();
  });
}

// add a department
function addDepartment() {
  inquirer.prompt({
    name: 'name',
    type: 'input',
    message: 'Enter the name of the department:'
  }).then(answer => {
    connection.query('INSERT INTO departments SET ?', { name: answer.name }, (err, res) => {
      if (err) throw err;
      console.log(`${res.affectedRows} department added!\n`);
      startPrompt();
    });
  });
}

// add a role
function addRole() {

    var query =
      `SELECT d.id, d.name, r.salary AS budget
      FROM employee e
      JOIN role r
      ON e.role_id = r.id
      JOIN department d
      ON d.id = r.department_id
      GROUP BY d.id, d.name`
  
    connection.query(query, function (err, res) {
      if (err) throw err;
  
      // (callbackfn: (value: T, index: number, array: readonly T[]) => U, thisArg?: any)
      const departmentChoices = res.map(({ id, name }) => ({
        value: id, name: `${id} ${name}`
      }));
  
      console.table(res);
      console.log("Department array!");
  
      promptAddRole(departmentChoices);
    });
  }