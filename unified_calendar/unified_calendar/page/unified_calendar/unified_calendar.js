frappe.pages['unified-calendar'].on_page_load = function(wrapper) {

    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Unified Calendar',
        single_column: true
    });

    let filterHTML = `
        <div style="margin-bottom:10px">
            <label style="margin-right:15px">
                <input type="checkbox" id="filter_task" checked> Task
            </label>

            <label style="margin-right:15px">
                <input type="checkbox" id="filter_todo" checked> ToDo
            </label>

            <label style="margin-right:15px">
                <input type="checkbox" id="filter_leave" checked> Leave
            </label>

            <label>
                <input type="checkbox" id="filter_holiday" checked> Holiday
            </label>
        </div>
    `;

    $(page.body).append(filterHTML);

    let calendarEl = document.createElement("div");
    $(page.body).append(calendarEl);

    frappe.require([
        "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js"
    ], function() {

        let allEvents = [];

        // ================= TASK =================

        frappe.call({
            method:"frappe.client.get_list",
            args:{
                doctype:"Task",
                fields:["name","subject","exp_start_date","exp_end_date"],
                limit_page_length:500
            },
            async:false,
            callback:function(r){

                if(!r.message) return;

                r.message.forEach(function(d){

                    if(d.exp_start_date){

                        allEvents.push({
                            title:d.subject,
                            start:d.exp_start_date,
                            end:d.exp_end_date,
                            color:"#5e64ff",
                            type:"task",
                            doctype:"Task",
                            name:d.name
                        });

                    }

                });

            }
        });


        // ================= TODO =================

        frappe.call({
            method:"frappe.client.get_list",
            args:{
                doctype:"ToDo",
                fields:["name","description","date"],
                limit_page_length:500
            },
            async:false,
            callback:function(r){

                if(!r.message) return;

                r.message.forEach(function(d){

                    if(d.date){

                        let temp = document.createElement("div");
                        temp.innerHTML = d.description || "";
                        let text = temp.innerText || temp.textContent;

                        allEvents.push({
                            title:text,
                            start:d.date,
                            color:"#20c997",
                            type:"todo",
                            doctype:"ToDo",
                            name:d.name
                        });

                    }

                });

            }
        });


        // ================= LEAVE =================

        frappe.call({
            method:"frappe.client.get_list",
            args:{
                doctype:"Leave Application",
                fields:["name","employee_name","from_date","to_date"],
                limit_page_length:500
            },
            async:false,
            callback:function(r){

                if(!r.message) return;

                r.message.forEach(function(d){

                    allEvents.push({
                        title:"Leave: "+d.employee_name,
                        start:d.from_date,
                        end:d.to_date,
                        color:"#ff6b6b",
                        type:"leave",
                        doctype:"Leave Application",
                        name:d.name
                    });

                });

            }
        });


// ================= HOLIDAY =================

frappe.call({
    method:"frappe.client.get_list",
    args:{
        doctype:"Holiday List",
        fields:["name"],
        order_by:"creation desc",
        limit_page_length:1
    },
    async:false,
    callback:function(res){

        if(!res.message.length) return;

        let holiday_list = res.message[0].name;

        frappe.call({
            method:"frappe.client.get",
            args:{
                doctype:"Holiday List",
                name:holiday_list
            },
            async:false,
            callback:function(r){

                if(!r.message) return;

                let holidays = r.message.holidays || [];

                holidays.forEach(function(d){

                    allEvents.push({
                        title:d.description,
                        start:d.holiday_date,
                        display:"background",
                        backgroundColor:"rgba(255,200,0,0.35)",
                        type:"holiday"
                    });

                });

            }

        });

    }

});


        // ================= CALENDAR =================

        let calendar = new FullCalendar.Calendar(calendarEl, {

            initialView:'dayGridMonth',

            height:"calc(100vh - 180px)",

            expandRows:true,

            headerToolbar:{
                left:'prev,next today',
                center:'title',
                right:'dayGridMonth,timeGridWeek,timeGridDay'
            },

            events:allEvents,

            eventClick:function(info){

                let doc = info.event.extendedProps;

                if(doc && doc.doctype){

                    frappe.set_route("Form",doc.doctype,doc.name);

                }

            },

            dayCellDidMount:function(info){

                let day = info.date.getDay();

                if(day === 0 || day === 6){

                    info.el.style.backgroundColor="rgba(255,0,0,0.08)";

                }

            }

        });

        calendar.render();

// ================= RIGHT CLICK MENU =================

$(document).on("contextmenu", ".fc-daygrid-day", function(e){

    e.preventDefault();

    let date = $(this).attr("data-date");

    let d = new frappe.ui.Dialog({
        title: "Create",
        fields: [
            {
                fieldtype: "HTML",
                options: `
                    <div style="display:flex;flex-direction:column;gap:8px">
                        <button class="btn btn-sm btn-primary add-task">Add Task</button>
                        <button class="btn btn-sm btn-default add-todo">Add ToDo</button>
                        <button class="btn btn-sm btn-default add-leave">Add Leave</button>
                    </div>
                `
            }
        ]
    });

    d.show();

    d.$wrapper.on("click", ".add-task", function(){
        d.hide();
        frappe.new_doc("Task",{ exp_start_date: date });
    });

    d.$wrapper.on("click", ".add-todo", function(){
        d.hide();
        frappe.new_doc("ToDo",{ date: date });
    });

    d.$wrapper.on("click", ".add-leave", function(){
        d.hide();
        frappe.new_doc("Leave Application",{ from_date: date, to_date: date });
    });

    d.$wrapper.on("click", ".add-holiday", function(){
        d.hide();
        frappe.new_doc("Holiday",{ holiday_date: date });
    });

});

// ================= RIGHT CLICK MENU =================

$(document).on("contextmenu", ".fc-daygrid-day", function(e){

    e.preventDefault();

    let date = $(this).attr("data-date");

    let menu = new frappe.ui.Menu();

    menu.add_item("Add Task", function(){
        frappe.new_doc("Task", {
            exp_start_date: date
        });
    });

    menu.add_item("Add ToDo", function(){
        frappe.new_doc("ToDo", {
            date: date
        });
    });

    menu.add_item("Add Leave", function(){
        frappe.new_doc("Leave Application", {
            from_date: date,
            to_date: date
        });
    });

    menu.show_at(e.pageX, e.pageY);

});
        // ================= FILTER LOGIC =================

        function applyFilter(){

            let showTask = $("#filter_task").is(":checked");
            let showTodo = $("#filter_todo").is(":checked");
            let showLeave = $("#filter_leave").is(":checked");
            let showHoliday = $("#filter_holiday").is(":checked");

            let filtered = allEvents.filter(function(e){

                if(e.type==="task" && !showTask) return false;
                if(e.type==="todo" && !showTodo) return false;
                if(e.type==="leave" && !showLeave) return false;
                if(e.type==="holiday" && !showHoliday) return false;

                return true;

            });

            calendar.removeAllEvents();
            calendar.addEventSource(filtered);

        }

        $("input[type=checkbox]").change(applyFilter);

    });

};