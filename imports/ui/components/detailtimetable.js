import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import i18next from 'i18next'
import { saveAs } from 'file-saver'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { NullXlsx } from '@neovici/nullxlsx'
import bootstrap from 'bootstrap'
import Timecards from '../../api/timecards/timecards'
import CustomFields from '../../api/customfields/customfields'
import {
  i18nextReady,
  addToolTipToTableCell,
  timeInUserUnit,
  getGlobalSetting,
  numberWithUserPrecision,
  getUserSetting,
  getUserTimeUnitVerbose,
  showToast,
} from '../../utils/frontend_helpers'
import projectUsers from '../../api/users/users.js'
import Projects from '../../api/projects/projects'
import { buildDetailedTimeEntriesForPeriodSelector } from '../../utils/server_method_helpers'
import './detailtimetable.html'
import './pagination.js'
import './limitpicker.js'

const Counts = new Mongo.Collection('counts')

dayjs.extend(utc)

function detailedDataTableMapper(entry) {
  const mapping = [Projects.findOne({ _id: entry.projectId }) ? Projects.findOne({ _id: entry.projectId }).name : '',
    dayjs.utc(entry.date).format(getGlobalSetting('dateformat')),
    entry.task,
    projectUsers.findOne() ? projectUsers.findOne().users.find((elem) => elem._id === entry.userId)?.profile?.name : '',
    Number(timeInUserUnit(entry.hours)),
    entry.state]
  if (!getGlobalSetting('useState')) {
    mapping.splice(5, 1)
  }
  if (CustomFields.find({ classname: 'time_entry' }).count() > 0) {
    for (const customfield of CustomFields.find({ classname: 'time_entry' }).fetch()) {
      mapping.push(entry[customfield.name])
    }
  }
  mapping.push(entry._id)
  return mapping
}
Template.detailtimetable.onCreated(function workingtimetableCreated() {
  this.totalDetailTimeEntries = new ReactiveVar()
  this.search = new ReactiveVar()
  this.sort = new ReactiveVar()
  this.tcid = new ReactiveVar()
  this.subscribe('customfieldsForClass', { classname: 'time_entry' })
  this.autorun(() => {
    if (this.data.project.get()
      && this.data.resource.get()
      && this.data.customer.get()
      && this.data.period.get()
      && this.data.limit.get()) {
      this.myProjectsHandle = this.subscribe('myprojects', {})
      this.projectUsersHandle = this.subscribe('projectUsers', { projectId: this.data.project.get() })
      this.selector = buildDetailedTimeEntriesForPeriodSelector({
        projectId: this.data.project.get(),
        search: this.search.get(),
        customer: this.data.customer.get(),
        period: this.data.period.get(),
        dates: {
          startDate: getUserSetting('customStartDate') ? getUserSetting('customStartDate') : dayjs.utc().startOf('month').toDate(),
          endDate: getUserSetting('customEndDate') ? getUserSetting('customEndDate') : dayjs.utc().toDate(),
        },
        userId: this.data.resource.get(),
        limit: this.data.limit.get(),
        page: Number(FlowRouter.getQueryParam('page')),
        sort: this.sort.get(),
      })
      delete this.selector[1].skip
      const subscriptionParameters = {
        projectId: this.data.project.get(),
        userId: this.data.resource.get(),
        customer: this.data.customer.get(),
        period: this.data.period.get(),
        limit: this.data.limit.get(),
        search: this.search.get(),
        page: Number(FlowRouter.getQueryParam('page')),
      }
      if (this.data.period.get() === 'custom') {
        subscriptionParameters.dates = {
          startDate: getUserSetting('customStartDate') ? getUserSetting('customStartDate') : dayjs.utc().startOf('month').toDate(),
          endDate: getUserSetting('customEndDate') ? getUserSetting('customEndDate') : dayjs.utc().toDate(),
        }
      }
      this.detailedEntriesPeriodCountHandle = this.subscribe('getDetailedTimeEntriesForPeriodCount', subscriptionParameters)
      this.detailedTimeEntriesForPeriodHandle = this.subscribe('getDetailedTimeEntriesForPeriod', subscriptionParameters)
    }
  })
})
Template.detailtimetable.onRendered(() => {
  const templateInstance = Template.instance()
  dayjs.extend(utc)
  templateInstance.autorun(() => {
    if (templateInstance.detailedTimeEntriesForPeriodHandle.ready()
      && templateInstance.projectUsersHandle.ready() && i18nextReady.get()) {
      const data = Timecards.find(templateInstance.selector[0], templateInstance.selector[1])
        .fetch().map(detailedDataTableMapper)
      if (data.length === 0) {
        $('.dt-row-totalRow').remove()
      }
      const columns = [
        { name: i18next.t('globals.project'), editable: false, format: addToolTipToTableCell },
        {
          name: i18next.t('globals.date'),
          editable: false,
          compareValue: (cell, keyword) => [dayjs.utc(cell, getGlobalSetting('dateformat')).toDate(), dayjs(keyword, getGlobalSetting('dateformat')).toDate()],
          format: addToolTipToTableCell,
        },
        { name: i18next.t('globals.task'), editable: false, format: addToolTipToTableCell },
        { name: i18next.t('globals.resource'), editable: false, format: addToolTipToTableCell },
        {
          name: getUserTimeUnitVerbose(),
          editable: false,
          format: numberWithUserPrecision,
        },
        {
          name: i18next.t('details.state'),
          editable: true,
          format: (value) => {
            if (value === null) {
              return ''
            }
            return value ? addToolTipToTableCell(i18next.t(`details.${value}`)) : addToolTipToTableCell(i18next.t('details.new'))
          },
        }]
      if (CustomFields.find({ classname: 'time_entry' }).count() > 0) {
        for (const customfield of CustomFields.find({ classname: 'time_entry' }).fetch()) {
          columns.push({
            name: customfield.desc,
            editable: false,
            format: addToolTipToTableCell,
          })
        }
      }
      columns.push(
        {
          name: i18next.t('navigation.edit'),
          editable: false,
          dropdown: false,
          focusable: false,
          format: (value) => (value && Timecards.findOne({ _id: value }).userId === Meteor.userId()
            ? `<div class="text-center">
                <a href="#" class="js-edit" data-id="${value}"><i class="fa fa-edit"></i></a>
                <a href="#" class="js-delete" data-id="${value}"><i class="fa fa-trash"></i></a>
              </div`
            : ''),
        },
      )
      if (!getGlobalSetting('useState')) {
        columns.splice(5, 1)
      }
      if (!templateInstance.datatable) {
        import('frappe-datatable/dist/frappe-datatable.css').then(() => {
          import('frappe-datatable').then((datatable) => {
            const DataTable = datatable.default
            const datatableConfig = {
              columns,
              data,
              serialNoColumn: false,
              clusterize: false,
              layout: 'fluid',
              showTotalRow: true,
              noDataMessage: i18next.t('tabular.sZeroRecords'),
              events: {
                onSortColumn(column) {
                  if (column) {
                    templateInstance.sort.set({ column: column.colIndex, order: column.sortOrder })
                  }
                },
              },
            }
            if (getGlobalSetting('useState')) {
              datatableConfig
                .getEditor = (colIndex, rowIndex, value, parent, column, row, editorData) => {
                  if (colIndex === '5' && Timecards.findOne({ _id: editorData[6] }).userId === Meteor.userId() && rowIndex !== 'totalRow') {
                    const $select = document.createElement('select')
                    $select.classList = 'form-control'
                    parent.style.padding = 0
                    $select.options.add(new Option(i18next.t('details.new'), 'new'))
                    $select.options.add(new Option(i18next.t('details.exported'), 'exported'))
                    $select.options.add(new Option(i18next.t('details.billed'), 'billed'))
                    $select.options.add(new Option(i18next.t('details.notBillable'), 'notBillable'))

                    parent.appendChild($select)
                    return {
                      initValue(initValue) {
                        $select.focus()
                        if (initValue) {
                          $($select).val(initValue)
                        } else {
                          $select.selectedIndex = 0
                        }
                      },
                      setValue(setValue) {
                        Meteor.call('setTimeEntriesState', { timeEntries: [editorData[6]], state: setValue }, (error) => {
                          if (error) {
                            console.error(error)
                          } else {
                            showToast(i18next.t('notifications.time_entry_updated'))
                          }
                        })
                      },
                      getValue() {
                        return $($select).val()
                      },
                    }
                  }
                  return null
                }
            }
            try {
              window.requestAnimationFrame(() => {
                templateInstance.datatable = new DataTable('#datatable-container', datatableConfig)
              })
            } catch (error) {
              console.error(`Caught error: ${error}`)
            }
          })
        })
      } else {
        try {
          templateInstance.datatable.refresh(data, columns)
        } catch (error) {
          console.error(`Caught error: ${error}`)
        }
      }
      templateInstance.totalDetailTimeEntries
        .set(Counts.findOne({ _id: templateInstance.data.project.get() })
          ? Counts.findOne({ _id: templateInstance.data.project.get() }).count : 0)
      if (window.BootstrapLoaded.get()) {
        if (data.length === 0) {
          $('.dt-scrollable').height('auto')
        } else {
          // window.requestAnimationFrame(() => {

          // })
        }
      }
    }
  })
})
Template.detailtimetable.helpers({
  detailTimeEntries() {
    return Timecards.find(Template.instance().selector[0], Template.instance().selector[1])
  },
  detailTimeSum() {
    return timeInUserUnit(Timecards
      .find(Template.instance().selector[0], Template.instance().selector[1])
      .fetch().reduce(((total, element) => total + element.hours), 0))
  },
  totalDetailTimeEntries() {
    return Template.instance().totalDetailTimeEntries
  },
  tcid() { return Template.instance().tcid },
  showInvoiceButton: () => (getUserSetting('siwappurl')) || getGlobalSetting('useState'),
})
Template.detailtimetable.events({
  'click .js-export-csv': (event, templateInstance) => {
    event.preventDefault()
    let csvArray
    if (getGlobalSetting('useState')) {
      csvArray = [`\uFEFF${i18next.t('globals.project')},${i18next.t('globals.date')},${i18next.t('globals.task')},${i18next.t('globals.resource')},${getUserTimeUnitVerbose()},${i18next.t('details.state')}`]
    } else {
      csvArray = [`\uFEFF${i18next.t('globals.project')},${i18next.t('globals.date')},${i18next.t('globals.task')},${i18next.t('globals.resource')},${getUserTimeUnitVerbose()}`]
    }
    if (CustomFields.find({ classname: 'time_entry' }).count() > 0) {
      csvArray[0] = `${csvArray[0]},${CustomFields.find({ classname: 'time_entry' }).fetch().map((field) => field.desc).join(',')}\r\n`
    }
    for (const timeEntry of Timecards
      .find(templateInstance.selector[0], templateInstance.selector[1])
      .fetch().map(detailedDataTableMapper)) {
      const row = []
      for (const attribute of timeEntry) {
        row.push(attribute)
      }
      row.splice(row.length - 1, 1)
      if (getGlobalSetting('useState')) {
        row[5] = i18next.t(`details.${timeEntry[5] ? timeEntry[5] : 'new'}`)
      } else {
        row.splice(5, 1)
      }
      csvArray.push(`${row.join(',')}\r\n`)
    }
    saveAs(new Blob(csvArray, { type: 'text/csv;charset=utf-8;header=present' }),
      `titra_export_${dayjs().format('YYYYMMDD-HHmm')}_${$('#resourceselect option:selected').text().replace(' ', '_').toLowerCase()}.csv`)
    Meteor.call('setTimeEntriesState', { timeEntries: Timecards.find(templateInstance.selector[0], templateInstance.selector[1]).fetch().map((entry) => entry._id), state: 'exported' }, (error) => {
      if (error) {
        console.error(error)
      }
    })
  },
  'click .js-export-xlsx': (event, templateInstance) => {
    event.preventDefault()
    let data
    if (getGlobalSetting('useState')) {
      data = [[i18next.t('globals.project'), i18next.t('globals.date'), i18next.t('globals.task'), i18next.t('globals.resource'), getUserTimeUnitVerbose(), i18next.t('details.state')]]
    } else {
      data = [[i18next.t('globals.project'), i18next.t('globals.date'), i18next.t('globals.task'), i18next.t('globals.resource'), getUserTimeUnitVerbose()]]
    }
    if (CustomFields.find({ classname: 'time_entry' }).count() > 0) {
      for (const customfield of CustomFields.find({ classname: 'time_entry' }).fetch()) {
        data[0].push(customfield.desc)
      }
    }
    if (!getGlobalSetting('useState')) {
      data[0].splice(5, 1)
    }
    for (const timeEntry of Timecards
      .find(templateInstance.selector[0], templateInstance.selector[1]).fetch()
      .map(detailedDataTableMapper)) {
      const row = []
      let index = 0
      for (const attribute of timeEntry) {
        if (index !== 6) {
          if (index === 5 && getGlobalSetting('useState')) {
            row.push(i18next.t(`details.${attribute !== undefined ? attribute : 'new'}`))
          } else if (index !== 5) {
            row.push(attribute)
          }
        }
        index += 1
      }
      // row.splice(row.length - 1, 1)
      data.push(row)
    }
    saveAs(new NullXlsx('temp.xlsx', { frozen: 1, filter: 1 }).addSheetFromData(data, 'titra export').createDownloadUrl(),
      `titra_export_${dayjs().format('YYYYMMDD-HHmm')}_${$('#resourceselect option:selected').text().replace(' ', '_').toLowerCase()}.xlsx`)
    Meteor.call('setTimeEntriesState', { timeEntries: Timecards.find(templateInstance.selector[0], templateInstance.selector[1]).fetch().map((entry) => entry._id), state: 'exported' }, (error) => {
      if (error) {
        console.error(error)
      }
    })
  },
  'click .js-track-time': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.tcid.set(undefined)
    new bootstrap.Modal($('#edit-tc-entry-modal')[0], { focus: false }).show()
    // FlowRouter.go('tracktime', { projectId: templateInstance.$('.js-target-project').val() })
  },
  'click .js-share': (event, templateInstance) => {
    event.preventDefault()
    if ($('#period').val() === 'all' || $('.js-target-project').val() === 'all') {
      showToast(i18next.t('notifications.sanity'))
      return
    }
    Meteor.call('addDashboard', {
      projectId: $('.js-target-project').val(), resourceId: $('#resourceselect').val(), customer: $('#customerselect').val(), timePeriod: $('#period').val(),
    }, (error, _id) => {
      if (error) {
        showToast(i18next.t('notifications.dashboard_creation_failed', { error }))
        // console.error(error)
      } else {
        $('#dashboardURL').val(FlowRouter.url('dashboard', { _id }))
        new bootstrap.Modal($('.js-dashboard-modal')[0], { focus: false }).toggle()
        // FlowRouter.go('dashboard', { _id })
      }
    })
  },
  'click .js-invoice': (event, templateInstance) => {
    event.preventDefault()
    if (getUserSetting('siwappurl') && getUserSetting('siwapptoken')) {
      Meteor.call('sendToSiwapp', {
        projectId: $('.js-target-project').val(), timePeriod: $('#period').val(), userId: $('#resourceselect').val(), customer: $('#customerselect').val(),
      }, (error, result) => {
        if (error) {
          showToast(i18next.t('notifications.export_failed', { error }))
        } else {
          showToast(i18next.t(result))
        }
      })
    } else {
      Meteor.call('setTimeEntriesState', { timeEntries: Timecards.find(templateInstance.selector[0], templateInstance.selector[1]).fetch().map((entry) => entry._id), state: 'billed' }, (error) => {
        if (error) {
          console.error(error)
        } else {
          showToast(i18next.t('notifications.time_entry_updated'))
        }
      })
    }
  },
  'click .js-delete': (event, templateInstance) => {
    event.preventDefault()
    if (confirm(i18next.t('notifications.delete_confirm'))) {
      Meteor.call('deleteTimeCard', { timecardId: templateInstance.$(event.currentTarget).data('id') }, (error, result) => {
        if (!error) {
          showToast(i18next.t('notifications.time_entry_deleted'))
        } else {
          console.error(error)
          if (typeof error.error === 'string') {
            showToast(i18next.t(error.error.replace('[', '').replace(']', '')))
          }
        }
      })
    }
  },
  'click .js-edit': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.tcid.set(templateInstance.$(event.currentTarget).data('id'))
    new bootstrap.Modal($('#edit-tc-entry-modal')[0], { focus: false }).show()
  },
  'change .js-search': (event, templateInstance) => {
    templateInstance.search.set($(event.currentTarget).val())
  },
  'change .js-project-filter>.js-target-project': (event, templateInstance) => {
    templateInstance.data.project.set(templateInstance.$('.js-target-project').val())
  },
})
Template.detailtimetable.onDestroyed(() => {
  FlowRouter.setQueryParams({ page: null })
  try {
    Template.instance().datatable?.destroy()
  } catch (error) {
    console.error(error)
  }
  Template.instance().datatable = undefined
})
