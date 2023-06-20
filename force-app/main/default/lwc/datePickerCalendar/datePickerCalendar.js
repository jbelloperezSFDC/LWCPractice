import { LightningElement, api, track, wire } from 'lwc';
import { DateTime } from 'c/luxon';
// import getUserOOOinfo from '@salesforce/apex/UserSchedulerService.getUserOOOinfo';
// import getUserAllocationInfo from '@salesforce/apex/UserSchedulerService.getUserAllocationInfo';
// import getHolidays from '@salesforce/apex/UserSchedulerService.getHolidays';

export default class DatePickerCalendar extends LightningElement {
    lastClass;
    today;
    year;
    month;
    formattedSelectedDate;
    calendarVisible;
    userOOOInfo;
    userAllocInfo;
    holidays;
    oooTitle = 'OOO';
    userAllocTitle = 'OffScedDay';
    holidayTitle = 'Holiday';
    busyDatesList = [];
    @api parentDate;
    @track dateContext;
    @track selectedDate;
    @track showInfo = false;
    @track dates = [];

    updateMonthYear() {
        this.year = this.dateContext.toLocaleString({ year: 'numeric' });
        this.month = this.dateContext.toLocaleString({ month: 'long' });
    }

    updateSelectedDate() {
        this.formattedSelectedDate = this.selectedDate.toLocaleString(
            DateTime.DATE_MED
        );
    }

    previousMonth() {
        this.dateContext = this.dateContext.minus({ months: 1 });
        this.updateMonthYear();
        this.refreshDateNodes(this.dateContext);
    }

    nextMonth() {
        this.dateContext = this.dateContext.plus({ months: 1 });
        this.updateMonthYear();
        this.refreshDateNodes(this.dateContext);
    }

    goToday() {
        this.selectedDate = this.today;
        this.dateContext = this.today;
        this.updateMonthYear();
        this.refreshDateNodes(this.dateContext);
    }

    setSelected(e) {
        const { date } = e.target.dataset;
        //setSelected() logic is limited to present and future dates.
        if (DateTime.fromISO(date).startOf('day') >= this.today.startOf('day')) {
            const selectedDate = this.template.querySelector('.selected');
            if (selectedDate) {
                selectedDate.className = this.lastClass;
            }

            this.selectedDate = DateTime.fromISO(date);
            this.updateSelectedDate();
            this.dateContext = DateTime.fromISO(date);
            this.lastClass = e.target.className;
            e.target.className = 'selected';

            this.calendarVisible = false;
            const eventdateSelected = new CustomEvent('dateselected', {
                detail: {
                    calendarVisible: this.calendarVisible,
                    date: this.formattedSelectedDate
                },
                bubbles: true
            });
            this.dispatchEvent(eventdateSelected);
        }
    }

    refreshDateNodes(date) {
        if (this.parentDate !== undefined && this.parentDate !== null) {
            this.selectedDate = DateTime.fromISO(
                new Date(this.parentDate).toISOString()
            );
            this.updateSelectedDate();
        }
        //Show month for selected date
        if (date !== undefined && date !== null) {
            this.dateContext = DateTime.isDateTime(date)
                ? date
                : DateTime.fromISO(new Date(date).toISOString());
            this.updateMonthYear();
        }

        this.dates = [];
        const startWeek = this.dateContext.startOf('month').weekNumber;
        //Flag to determine when prev year's week is displayed in Jan of new year
        const flag = startWeek > this.dateContext.weekNumber ? true : false;
        const currentMoment = this.dateContext;
        // get number of weeks to display in current month view
        const numWeeks = Math.ceil(
            currentMoment.endOf('month').diff(currentMoment.startOf('month'), 'weeks')
                .weeks
        );
        for (let week = startWeek; week <= startWeek + numWeeks; week++) {
            Array(7)
                .fill(0)
                .forEach((n, i) => {
                    let day = flag
                        ? currentMoment.set({ weekNumber: week }).minus({ year: 1 })
                        : currentMoment.set({ weekNumber: week });
                    if (day.weekday === 7 && day.startOf('week').weekNumber !== week) {
                        day = day.startOf('week').plus({ day: 6 });
                    } else {
                        day = day.startOf('week').minus({ day: 1 });
                    }
                    day = day.plus({ days: n + i });

                    let className = '';
                    if (day.month === this.dateContext.month) {
                        //Try to highlight busy dates, but if error happens continue with calendar functionality
                        try {
                            className = this.markBusyDates(day);
                        } catch {
                            if (day.hasSame(this.today, 'day')) {
                                className = 'today';
                            } else {
                                className = 'date';
                            }
                        } finally {
                            if (day.hasSame(this.selectedDate, 'day')) {
                                className = 'selected';
                            }
                        }
                    } else {
                        className = 'padder';
                    }
                    if (day.startOf('day') < this.today.startOf('day')) {
                        className += ' past';
                    }

                    this.dates.push({
                        className,
                        formatted: day.toFormat('yyyy-MM-dd'),
                        text: day.toFormat('d')
                    });
                });
        }
    }

    markBusyDates(day) {
        let typeOfDayOff = '';
        let className = '';
        if (day.startOf('day') >= this.today.startOf('day')) {
            this.busyDatesList
                .filter((item) => {
                    return (
                        day.startOf('day') >= item.start.startOf('day') &&
                        day.startOf('day') <= item.end.startOf('day')
                    );
                })
                .forEach((itemDay) => {
                    typeOfDayOff = itemDay.title;
                });
        }

        if (typeOfDayOff === this.holidayTitle) {
            className = 'holiday';
        } else if (typeOfDayOff === this.userAllocTitle) {
            className = 'osd';
        } else if (typeOfDayOff === this.oooTitle) {
            className = 'ooo';
        } else if (day.hasSame(this.today, 'day')) {
            className = 'today';
        } else {
            className = 'date';
        }

        return className;
    }

    // @wire(getUserOOOinfo)
    // wiredOOO({ error, data }) {
    //     if (data) {
    //         this.userOOOInfo = data.map((item) => {
    //             return {
    //                 id: item.Id,
    //                 title: this.oooTitle,
    //                 start: DateTime.fromISO(item.OOO_Start_Time__c),
    //                 end: DateTime.fromISO(item.OOO_End_Time__c)
    //             };
    //         });

    //         if (this.userOOOInfo && this.userAllocInfo && this.holidays) {
    //             this.busyDatesList.push.apply(this.busyDatesList, this.userOOOInfo);
    //             this.busyDatesList.push.apply(this.busyDatesList, this.userAllocInfo);
    //             this.busyDatesList.push.apply(this.busyDatesList, this.holidays);
    //             this.today = DateTime.now();
    //             this.dateContext = DateTime.now();
    //             this.selectedDate = DateTime.now();
    //             this.updateMonthYear();
    //             this.updateSelectedDate();
    //             this.refreshDateNodes(this.parentDate);
    //         }
    //     } else if (error) {
    //         console.warn(error);
    //     }
    // }
    // @wire(getUserAllocationInfo)
    // wiredOSD({ error, data }) {
    //     if (data) {
    //         this.userAllocInfo = data.map((item) => {
    //             return {
    //                 id: item.Id,
    //                 title: this.userAllocTitle,
    //                 start: DateTime.fromISO(item.OffScheduleDay__c),
    //                 end: DateTime.fromISO(item.OffScheduleDay__c)
    //             };
    //         });

    //         if (this.userOOOInfo && this.userAllocInfo && this.holidays) {
    //             this.busyDatesList.push.apply(this.busyDatesList, this.userOOOInfo);
    //             this.busyDatesList.push.apply(this.busyDatesList, this.userAllocInfo);
    //             this.busyDatesList.push.apply(this.busyDatesList, this.holidays);
    //             this.today = DateTime.now();
    //             this.dateContext = DateTime.now();
    //             this.selectedDate = DateTime.now();
    //             this.updateMonthYear();
    //             this.updateSelectedDate();
    //             this.refreshDateNodes(this.parentDate);
    //         }
    //     } else if (error) {
    //         console.warn(error);
    //     }
    // }
    // @wire(getHolidays)
    // wHoliday({ error, data }) {
    //     if (data) {
    //         this.holidays = data.map((item) => {
    //             return {
    //                 id: item.Id,
    //                 title: this.holidayTitle,
    //                 start: DateTime.fromISO(item.ActivityDate),
    //                 end: DateTime.fromISO(item.ActivityDate),
    //                 name: item.Name
    //             };
    //         });

    //         if (this.userOOOInfo && this.userAllocInfo && this.holidays) {
    //             this.busyDatesList.push.apply(this.busyDatesList, this.userOOOInfo);
    //             this.busyDatesList.push.apply(this.busyDatesList, this.userAllocInfo);
    //             this.busyDatesList.push.apply(this.busyDatesList, this.holidays);
    //             this.today = DateTime.now();
    //             this.dateContext = DateTime.now();
    //             this.selectedDate = DateTime.now();
    //             this.updateMonthYear();
    //             this.updateSelectedDate();
    //             this.refreshDateNodes(this.parentDate);
    //         }
    //     } else if (error) {
    //         console.warn(error);
    //     }
    // }
}