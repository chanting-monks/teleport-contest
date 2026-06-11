/* NetHack 5.0	calendar.c	$NHDT-Date: 1706213796 2024/01/25 20:16:36 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.116 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Michael Allison, 2007. */
/* Copyright (c) Robert Patrick Rankin, 1991                      */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * Time routines
 *
 * The time is used for:
 *  - seed for rand()
 *  - year on tombstone and yyyymmdd in record file
 *  - phase of the moon (various monsters react to NEW_MOON or FULL_MOON)
 *  - night and midnight (the undead are dangerous at midnight)
 *  - determination of what files are "very old"
 */
/* TIME_type: type of the argument to time(); we actually use &(time_t);
   you might need to define either or both of these to 'long *' in *conf.h */
import { localtime, time } from '../c2js-runtime/calendar.js';
import { nh_snprintf } from '../c2js-runtime/stdio.js';
import { atoi, strlen } from '../c2js-runtime/string.js';

export function getnow() {
    let datetime = 0;
    time(datetime);
    return datetime;
}
export function getlt() {
    let date = getnow();
    return localtime(date);
}
export function getyear() {
    return (1900 + getlt().tm_year);
}
export function yyyymmdd(date) {
    let datenum = 0;
    let lt = null;
    if (date == 0) {
        lt = getlt();
    } else {
        lt = localtime(date);
    }
    if (lt.tm_year < 70) {
        datenum = lt.tm_year + 2000;
    /* just in case somebody's localtime supplies (year % 100)
       rather than the expected (year - 1900) */
    } else {
        datenum = lt.tm_year + 1900;
    }
    datenum = datenum * 100 + (lt.tm_mon + 1);
    datenum = datenum * 100 + lt.tm_mday;
    return datenum;
}
export function hhmmss(date) {
    let timenum = 0;
    let lt = null;
    if (date == 0) {
        lt = getlt();
    } else {
        lt = localtime(date);
    }
    timenum = lt.tm_hour * 10000 + lt.tm_min * 100 + lt.tm_sec;
    return timenum;
}
let __yyyymmddhhmmss_datestr = '';
export function yyyymmddhhmmss(date) {
    let datenum = 0;
    let lt = null;
    if (date == 0) {
        lt = getlt();
    } else {
        lt = localtime(date);
    }
    if (lt.tm_year < 70) {
        datenum = lt.tm_year + 2000;
    } else {
        datenum = lt.tm_year + 1900;
    }
    __yyyymmddhhmmss_datestr = nh_snprintf("yyyymmddhhmmss", 114, __yyyymmddhhmmss_datestr, 15 /* sizeof(char [15]) */, "%04ld%02d%02d%02d%02d%02d", datenum, lt.tm_mon + 1, lt.tm_mday, lt.tm_hour, lt.tm_min, lt.tm_sec);
    //debugpline1("yyyymmddhhmmss() produced date string %s", datestr);
    return __yyyymmddhhmmss_datestr;
}
export function time_from_yyyymmddhhmmss(buf) {
    let k = 0;
    let timeresult = 0;
    let t = { tm_sec: 0, tm_min: 0, tm_hour: 0, tm_mday: 0, tm_mon: 0, tm_year: 0, tm_wday: 0, tm_yday: 0, tm_isdst: 0, tm_gmtoff: 0, tm_zone: null };
    let lt = null;
    let d = null;
    let p = null;
    let y = '';
    let mo = '';
    let md = '';
    let h = '';
    let mi = '';
    let s = '';
    if (buf && strlen(buf) == 14) {
        d = buf;
        y = d.slice(0, 4);
        d = d.slice(4);
        mo = d.slice(0, 2);
        d = d.slice(2);
        md = d.slice(0, 2);
        d = d.slice(2);
        h = d.slice(0, 2);
        d = d.slice(2);
        mi = d.slice(0, 2);
        d = d.slice(2);
        s = d.slice(0, 2);
        d = d.slice(2);
        lt = getlt();
        if (lt) {
            Object.assign(t, lt);
            t.tm_year = atoi(y) - 1900;
            t.tm_mon = atoi(mo) - 1;
            t.tm_mday = atoi(md);
            t.tm_hour = atoi(h);
            t.tm_min = atoi(mi);
            t.tm_sec = atoi(s);
            timeresult = mktime(t);
        }
        if (timeresult == -1) {
            ;
        } else {
            return timeresult;
        }
    }
    return 0;
}
/*
 * moon period = 29.53058 days ~= 30, year = 365.2422 days
 * days moon phase advances on first day of year compared to preceding year
 *      = 365.2422 - 12*29.53058 ~= 11
 * years in Metonic cycle (time until same phases fall on the same days of
 *      the month) = 18.6 ~= 19
 * moon phase on first day of year (epact) ~= (11*(year%19) + 29) % 30
 *      (29 as initial condition)
 * current phase in days = first day phase + days elapsed in year
 * 6 moons ~= 177 days
 * 177 ~= 8 reported phases * 22
 * + 11/22 for rounding
 */
/* 0-7, with 0: new, 4: full */
export function phase_of_the_moon() {
    let lt = getlt();
    let epact = 0;
    let diy = 0;
    let goldn = 0;
    diy = lt.tm_yday;
    goldn = (lt.tm_year % 19) + 1;
    epact = (11 * goldn + 18) % 30;
    if ((epact == 25 && goldn > 11) || epact == 24) {
        epact++;
    }
    return ((Math.trunc(((((diy + epact) * 6) + 11) % 177) / 22)) & 7);
}
export function friday_13th() {
    let lt = getlt();
    /* tm_wday (day of week; 0==Sunday) == 5 => Friday */
    return (lt.tm_wday == 5 && lt.tm_mday == 13);
}
export function night() {
    let hour = getlt().tm_hour;
    return (hour < 6 || hour > 21);
}
export function midnight() {
    return (getlt().tm_hour == 0);
}
/* calendar.c */
