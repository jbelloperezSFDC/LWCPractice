import { LightningElement, api } from 'lwc';
import deleteTodo from '@salesforce/apex/ToDoController.deleteTodo';
import updateTodo from '@salesforce/apex/ToDoController.updateTodo';

export default class TodoItem extends LightningElement {
    @api todoId;
    @api todoName;
    @api done = false;

    //Dynamically change the class for the todo item
    get containerClass() {
        return this.done ? 'todo completed' : 'todo upcoming';
    }

    //Dynamically change the icon for the check button
    get checkButtonIcon() {
        return !this.done ? "utility:check" : "utility:skip_back";
    }

    //Dynamically change the icon for the delete button
    get deleteButtonIcon() {
        return !this.done ? "utility:delete" : "utility:clear";
    }

    //Handles the todo once it has been completed. Button next to todo
    checkedHandler() {
        const todoToUpdt = {
            todoId: this.todoId,
            todoName: this.todoName,
            done: !this.done
        };
        updateTodo({ payload: JSON.stringify(todoToUpdt) })
            .then(() => {
                console.log('Updating todo');
                const updateEvent = new CustomEvent('update');
                this.dispatchEvent(updateEvent);
            })
            .catch(err => {
                console.error("Error in updatig records ", err.message);
            });
    }

    //Handles when the todo is deleted button next to todo on the completed area
    deleteHandler() {
        console.log('variable:', this.todoId);
        deleteTodo({ todoId: this.todoId })
            .then(() => {
                const deleteEvent = new CustomEvent('delete');
                this.dispatchEvent(deleteEvent);
            })
            .catch(err => {
                console.error('Error deleting todo ', err);
            });
    }
}