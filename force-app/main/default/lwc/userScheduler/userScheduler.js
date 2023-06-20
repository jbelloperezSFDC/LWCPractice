import { LightningElement, api, track } from 'lwc';
import { DateTime } from 'c/luxon';
// import getEventInfo from '@salesforce/apex/UserSchedulerService.getEventInfo';

export default class UserScheduler extends LightningElement {
    events;
    eventRecordType = 'Banker';
    dateVal;
    timeVal;
    durationVal = '15';
    durationOptions = [
        { label: '15', value: '15' },
        { label: '30', value: '30' },
        { label: '45', value: '45' },
        { label: '60', value: '60' }
    ];
    @api header;
    @track timeOptions;
    @track timeDisabled = true;
    @track intervalHidden = true;
    @track calendarVisible = false;

    populateTimeBox(date) {
        date = DateTime.fromISO(new Date(date).toISOString()).toFormat('yyyy-MM-dd');
        const minutes = ['00', '15', '30', '45'];
        let hours = 6;
        let currMin;
        let tempTime;
        let timeLabel = '';
        let timeList = [];

        this.events = this.events.filter((item) => {
            return (
                DateTime.fromISO(date).startOf('day') >= item.start.startOf('day') &&
                DateTime.fromISO(date).startOf('day') <= item.end.startOf('day')
            );
        });

        //For today show only future times
        if (DateTime.fromISO(date).hasSame(DateTime.now(), 'day')) {
            hours = parseInt(this.getNextTimeInterval(minutes).hour);
            currMin = this.getNextTimeInterval(minutes).min;
        } else {
            currMin = 0;
        }

        //Default Time value
        let currTime = DateTime.fromISO(
            date + 'T' + this.getNextTimeInterval(minutes).hour +
            ':' + minutes[this.getNextTimeInterval(minutes).min]
        );
        this.timeVal = currTime.toFormat('t');

        for (; hours <= 20; hours++) {
            for (let min = currMin; min < minutes.length; min++) {
                tempTime = DateTime.fromISO(
                    date + 'T' + (hours < 10 ? '0' + hours : hours) +
                    ':' + minutes[min]
                );
                //Try to highlight busy times, but if error happens continue to display all time intervals
                try {
                    for (let item of this.events) {
                        if (
                            tempTime.startOf('minute') >= (item.start).startOf('minute') &&
                            tempTime.startOf('minute') < (item.end).startOf('minute')
                        ) {
                            if (item.type !== undefined && item.type !== null) {
                                if ((item.type).DeveloperName === this.eventRecordType) {
                                    timeLabel = ' (OurHouseEvent)';
                                } else {
                                    timeLabel = ' (OutLookEvent)';
                                }
                            } else {
                                timeLabel = ' (OutLookEvent)';
                            }
                            //Override timeVal to add timeLabel in case there is an event at current time interval
                            if (tempTime.hasSame(currTime, 'minute')) {
                                this.timeVal = currTime.toFormat('t') + timeLabel;
                            }
                            break;
                        } else {
                            timeLabel = '';
                        }
                    }
                } catch {
                    timeLabel = '';
                } finally {
                    tempTime =
                        DateTime.fromISO(
                            date +
                            'T' +
                            (hours < 10 ? '0' + hours : hours) +
                            ':' +
                            minutes[min]
                        ).toFormat('t') + timeLabel;
                    timeList.push({ label: tempTime, value: tempTime });

                    if (hours === 20 && minutes[min] === '45') {
                        let lastTime =
                            DateTime.fromISO(date + 'T21:00').toFormat('t') + timeLabel;
                        timeList.push({ label: lastTime, value: lastTime });
                    }
                }
            }
            currMin = 0;
        }

        return timeList;
    }

    getNextTimeInterval(minutes) {
        let today = DateTime.now();

        if (today.toFormat('mm') <= minutes[0]) {
            return { hour: today.toFormat('HH'), min: 0 };
        } else if (today.toFormat('mm') <= minutes[1]) {
            return { hour: today.toFormat('HH'), min: 1 };
        } else if (today.toFormat('mm') <= minutes[2]) {
            return { hour: today.toFormat('HH'), min: 2 };
        } else if (today.toFormat('mm') <= minutes[3]) {
            return { hour: today.toFormat('HH'), min: 3 };
        }
        return { hour: today.plus({ hours: 1 }).toFormat('HH'), min: 0 };
    }

    handleTimeChange(event) {
        this.timeVal = event.detail.value;

        if (this.timeVal && this.dateVal && this.durationVal) {
            this.dispatchEventDateSelected();
        }
    }

    handleDurationChange(event) {
        this.durationVal = event.detail.value;

        if (this.timeVal && this.dateVal && this.durationVal) {
            this.dispatchEventDateSelected();
        }
    }

    dispatchEventDateSelected() {
        //Format date with "/" instead of "-" to be compatible with Safari browsers
        const eventDateSelected = new CustomEvent('EventDateSelect', {
            detail: {
                date: DateTime.fromISO(new Date(this.dateVal)
                    .toISOString()).toFormat('yyyy/MM/dd'),
                time: this.timeVal,
                duration: this.durationVal
            },
            bubbles: true
        });
        this.dispatchEvent(eventDateSelected);
    }

    @api clearFieldValues() {
        this.dateVal = undefined;
        this.timeVal = undefined;
        this.durationVal = '15';
        this.timeDisabled = true;
        this.intervalHidden = true;
    }

    showCalendar() {
        this.calendarVisible = !this.calendarVisible;
    }

    // handleSelectedDate(event) {
    // this.calendarVisible = event.detail.calendarVisible;
    // this.dateVal = event.detail.date;
    // this.timeDisabled = false;
    // this.intervalHidden = false;
    // getEventInfo({ dateSelected: new Date(this.dateVal) })
    //   .then((response) => {
    //     this.events = response.map((item) => {
    //       return {
    //         id: item.Id,
    //         title: item.Subject,
    //         start: DateTime.fromISO(item.StartDateTime),
    //         end: DateTime.fromISO(item.EndDateTime),
    //         type: item.RecordType
    //       };
    //     });
    //     if (this.events) {
    //       this.timeOptions = this.populateTimeBox(this.dateVal);
    //     }
    //     if (this.timeVal && this.dateVal && this.durationVal) {
    //       this.dispatchEventDateSelected();
    //     }
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //   });
    // }
}