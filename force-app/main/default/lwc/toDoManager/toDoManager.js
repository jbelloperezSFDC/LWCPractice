import { LightningElement, track } from 'lwc';
import addTodo from '@salesforce/apex/ToDoController.addTodo';
import getCurrentTodos from '@salesforce/apex/ToDoController.getCurrentTodos';

export default class ToDoManager extends LightningElement {
    @track time;
    @track greeting;
    @track todoList = [];
    //Filters upcoming tasks only to display under upcoming label
    get upcomingTask() {
        if (this.todoList && this.todoList.length) {
            return this.todoList.filter(todo => !todo.done);
        }
        return [];
    }
    //Filters completed tasks only to display under completed label
    get completedTask() {
        if (this.todoList && this.todoList.length) {
            return this.todoList.filter(todo => todo.done);
        }
        return [];
    }

    connectedCallback() {
        this.getTime();
        this.fetchTodos();
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setInterval(() => {
            this.getTime();
        }, 1000 * 60);
    }

    //Return the time and greeting for the todo component
    getTime() {
        const date = new Date();
        const hour = date.getHours();
        const minutes = date.getMinutes();

        this.time = `${this.formatHour(hour)}:${this.getDoubleDigits(minutes)} ${this.getAmOrPm(hour)}`;
        this.greeting = this.setGreeting(hour);
    }

    //Formats the greeting according to the time a day 
    setGreeting(hour) {
        if (hour >= 18) {
            return 'Good Evening';
        } else if (hour >= 12) {
            return 'Good Afternoon';
        }
        return 'Good Morning';
    }

    //Convert hour from 24 format to 1-12
    formatHour(hour) {
        return ((hour + 11) % 12 + 1);
    }

    //Adds a 0 in front of single digits to maintain the same amount of digits(2)
    getDoubleDigits(digits) {
        return digits < 10 ? '0' + digits : digits;
    }

    //Return AM or PM accordingly to complete the hour format
    getAmOrPm(hour) {
        return hour >= 12 ? 'PM' : 'AM';
    }

    //Logic for the plus button next to the input field. Adds a todo to the back end by calling Apex function
    addTodoHandler() {
        const inputBox = this.template.querySelector('lightning-input');
        const todo = {
            todoName: inputBox.value,
            done: false
        };
        addTodo({ payload: JSON.stringify(todo) })
            .then(() => {
                this.fetchTodos();
            }).catch(err => {
                console.error('Error inserting todo: ', err);
            });
        inputBox.value = '';
    }

    //Capture the custom event delete to handle it
    deleteHandler() {
        this.fetchTodos();
    }

    //Capture the custom event update to handle it
    updateHandler() {
        this.fetchTodos();
    }

    //Logic for getting the existing todos from backend through an Apex function
    fetchTodos() {
        console.log('Fetching');
        getCurrentTodos()
            .then(response => {
                if (response) {
                    this.todoList = response;
                }
            }).catch(err => {
                console.error('Error fetching response: ', err);
            });
    }

}