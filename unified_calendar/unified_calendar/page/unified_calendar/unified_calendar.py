import frappe

@frappe.whitelist()
def get_calendar_events():

    events = []

    tasks = frappe.get_all(
        "Task",
        fields=["name","subject","exp_start_date","exp_end_date"]
    )

    for t in tasks:
        events.append({
            "title": f"Task: {t.subject}",
            "start": t.exp_start_date,
            "end": t.exp_end_date,
            "doctype": "Task",
            "name": t.name
        })

    leaves = frappe.get_all(
        "Leave Application",
        fields=["name","employee_name","from_date","to_date"]
    )

    for l in leaves:
        events.append({
            "title": f"Leave: {l.employee_name}",
            "start": l.from_date,
            "end": l.to_date,
            "doctype": "Leave Application",
            "name": l.name
        })

    events_data = frappe.get_all(
        "Event",
        fields=["name","subject","starts_on","ends_on"]
    )

    for e in events_data:
        events.append({
            "title": f"Event: {e.subject}",
            "start": e.starts_on,
            "end": e.ends_on,
            "doctype": "Event",
            "name": e.name
        })

    return events
