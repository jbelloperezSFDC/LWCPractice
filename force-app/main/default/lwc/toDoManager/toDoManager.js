import { LightningElement, track } from 'lwc';
import addTodo from '@salesforce/apex/ToDoController.addTodo';
import getCurrentTodos from '@salesforce/apex/ToDoController.getCurrentTodos';

export default class ToDoManager extends LightningElement {
    @track time;
    @track greeting;
    @track todoList = [];

    connectedCallback() {
        this.getTime();
        this.fetchTodos();
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setInterval(() => {
            this.getTime();
        }, 1000 * 60);
    }

    getTime() {
        const date = new Date();
        const hour = date.getHours();
        const minutes = date.getMinutes();

        this.time = `${this.formatHour(hour)}:${this.getDoubleDigits(minutes)} ${this.getAmOrPm(hour)}`;
        this.greeting = this.setGreeting(hour);
    }

    setGreeting(hour) {
        if (hour >= 18) {
            return 'Good Evening';
        } else if (hour >= 12) {
            return 'Good Afternoon';
        }
        return 'Good Morning';
    }

    formatHour(hour) {
        return ((hour + 11) % 12 + 1);
    }

    getDoubleDigits(digits) {
        return digits < 10 ? '0' + digits : digits;
    }

    getAmOrPm(hour) {
        return hour >= 12 ? 'PM' : 'AM';
    }

    addTodoHandler() {
        const inputBox = this.template.querySelector('lightning-input');
        const todo = {
            todoName: inputBox.value,
            done: false
        };
        addTodo({ payload: JSON.stringify(todo) })
            .then(response => {
                console.log(response);
                console.log('Inserted Successfully');
                this.fetchTodos();
            }).catch(err => {
                console.error('Error inserting todo: ', err);
            });
        // this.todoList.push(todo);
        inputBox.value = '';
    }

    fetchTodos() {
        getCurrentTodos()
            .then(response => {
                if (response) {
                    this.todoList = response;
                }
            }).catch(err => {
                console.error('Error fetching response: ', err);
            });
    }

    get upcomingTask() {
        if (this.todoList && this.todoList.length) {
            return this.todoList.filter(todo => !todo.done);
        }
        return [];
    }

    get completedTask() {
        if (this.todoList && this.todoList.length) {
            return this.todoList.filter(todo => todo.done);
        }
        return [];
    }

}