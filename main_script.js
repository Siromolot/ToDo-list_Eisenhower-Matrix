"use strict";

// счетчик для созданных задач (пригодится позже, когда буду localStorage прописывать)
let idCounter = 1;

// переменная для обозначения перетаскиваемого элемента
let dragged = null;

// выбираем все четыре поля
let fields = document.querySelectorAll(".field");

// для каждого поля (а вернее, для конкретного поля из всего массива) 
fields.forEach(fieldsElement => {

    // вешаем обработчик событий на кнопку создания задачи
    let addTask = fieldsElement.querySelector(".add_task");
    
    addTask.addEventListener("click", function createTask() {

        // создание задачи и установка общих аттрибутов
        let newTask = document.createElement("div");
        newTask.classList.add("task");
        newTask.setAttribute("draggable", "true");
        newTask.setAttribute("id", idCounter);
        idCounter++;        

        // создаем блок для иконок выполнения и удаления задачи
        let iconBlock = document.createElement("div");
        iconBlock.classList.add("icon_block");

        // добавляем блок для иконок в задачу
        newTask.append(iconBlock);

        // создаем иконку удаления задачи (работает только при наличии в корневой директории font-awesome)
        let delTask = document.createElement("i");
        delTask.classList.add("fa");
        delTask.classList.add("fa-trash");
        delTask.setAttribute("aria-hidden", "true");
        // устанавливаем false на возможность редактирования, ибо почему-то введенный текст попадает в первую по списку <i>. А теперь текст будет записываться просто в div
        delTask.setAttribute("contenteditable", false);

        // сразу вешаем на иконку обработчик на удаление задачи при клике
        delTask.addEventListener("click", function() {
            newTask.remove();
        });

        // добавляем иконку удаления задачи в блок для иконок
        iconBlock.append(delTask);

        // создаем иконку выполнения задачи
        let done = document.createElement("i");
        done.classList.add("fa");
        done.classList.add("fa-check");
        done.setAttribute("aria-hidden", "true");
        done.setAttribute("contenteditable", false);

        //счетчик кликов нам пригодится для понимания, отмечаем задачу выполненной или наоборот - возвращаем ее к вновь активным. От этого будет зависеть ее местоположение (внизу списка или в начале)
        let clickCounter = 1;

        // сразу вешаем на нее обработчик отметки задачи как выполненной и переноса в конец списка задач (и возврата обратно к активным)
        done.addEventListener("click", function() {
            newTask.classList.toggle("done");
            clickCounter++;
            if (clickCounter % 2 === 0) {
                // переносим задачу в конец списка (что презабавно - если не использовать this, то задача вернется в то поле, в котором была создана, даже если была перенесена)
                this.closest(".tasks_list").append(newTask);
            } else {
                // переносим задачу в начало списка 
                this.closest(".tasks_list").prepend(newTask);
            }
        });

        // добавляем иконку выполнения в блок для иконок
        iconBlock.append(done);
    
        // добавляем задачу в поле
        fieldsElement.querySelector(".tasks_list").append(newTask);
    
        // устанавливаем возможность (и необходимость) редактирования текста задачи сразу при создании
        newTask.setAttribute("contenteditable", "true");
        newTask.focus();
        taskEdit(newTask);
    });
});


// функция для редактирования текста задачи
function taskEdit(newTask) {

    // при двойном клике убираем возможность перемещения и добавляем редактирование текста задачи
    newTask.addEventListener("dblclick", function(event) {
        newTask.setAttribute("contenteditable", "true");
        newTask.removeAttribute("draggable");
        newTask.focus();
    });

    // добавляем работу с клавиатурой - при нажатии Enter появляется не новая строка в задаче, а задача сохраняется (т.е. убирается фокус с активной задачи)
    newTask.addEventListener("keydown", function(event) {
        if(event.keyCode === 13){
            newTask.blur();
        }
    });

    // при снятии фокуса возвращаем возможность перетаскивания и убираем возможность редактирования
    newTask.addEventListener("blur", function (event) {
        newTask.removeAttribute("contenteditable");
        newTask.setAttribute("draggable", "true");

        // если задача осталась пустой (или только с пробелами) - удаляем ее
        if(!newTask.textContent.trim().length) {
            newTask.remove();
            idCounter--;
        }
    });

    // перетаскивание задач
    newTask.addEventListener("drop", drop);
    newTask.addEventListener("dragstart", dragstart);
    newTask.addEventListener("dragend", dragend);
    newTask.addEventListener("dragenter", dragenter);
    newTask.addEventListener("dragover", dragover);
    newTask.addEventListener("dragleave", dragleave);

    function dragstart (event) {
        dragged = this;
        this.classList.add("dragged");
    }

    function dragend (event) {
        dragged = null;
        this.classList.remove("dragged");
        let task = document.querySelectorAll(".task");
        task.forEach(x => x.classList.remove("under"));
    }

    function dragenter (event) {
        if (this === dragged) {
            return;
        }

        this.classList.add("under");
    }

    function dragover (event) {
        event.preventDefault();
        if (this === dragged) {
            return;
        }
    }

    function dragleave (event) {
        if (this === dragged) {
            return;
        }

        this.classList.remove("under");
    }

    fields.forEach(fieldsElement => {

        // возможность перетаскивать задачи в другие блоки
        fieldsElement.addEventListener("dragover", function (event) {
            //preventDefault нужен для того, чтобы иметь возможность перетаскивать задачи не только на другие задачи, но и на пустое поле в любое его место. Без него drop не сработает 
            event.preventDefault();
        });

        fieldsElement.addEventListener("drop", function (event) {
            if (dragged) {
                return fieldsElement.querySelector(".tasks_list").append(dragged);
            }
        });
    });

    function drop (event) {
        
        //stopPropagation нужен для остановки всплытия, это позволит нам вставлять пертаскиваемый элемент не в конец списка, а в интересующее нас место (в соответствии с кодом ниже)
        event.stopPropagation();
        if (this === dragged) {
            return;
        }

        if (this.parentElement === dragged.parentElement) {
            let task = Array.from(this.parentElement.querySelectorAll(".task"));
            let indexA = task.indexOf(this);
            let indexB = task.indexOf(dragged);

            if (indexA < indexB) {
                this.parentElement.insertBefore(dragged, this);
            } 

            else {
                this.parentElement.insertBefore(dragged, this.nextElementSibling);
            }
        }
        
        else {
            this.parentElement.insertBefore(dragged, this);
        }
    }
}

