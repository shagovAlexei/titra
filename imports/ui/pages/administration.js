import dayjs from 'dayjs'
import { Random } from 'meteor/random'
import i18next from 'i18next'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './administration.html'
import { Globalsettings } from '../../api/globalsettings/globalsettings'
import { displayUserAvatar, validateEmail, showToast } from '../../utils/frontend_helpers'
import '../components/limitpicker.js'
import Extensions from '../../api/extensions/extensions'
import CustomFields from '../../api/customfields/customfields.js'

Template.administration.onCreated(function administrationCreated() {
  this.limit = new ReactiveVar(25)
  this.subscribe('extensions')
  this.subscribe('customfields')
  this.autorun(() => {
    if (FlowRouter.getQueryParam('limit')) {
      this.limit.set(Number(FlowRouter.getQueryParam('limit')))
      this.$('#limitpicker').val(FlowRouter.getQueryParam('limit'))
    }
    this.subscribe('adminUserList', { limit: this.limit.get() })
  })
})

Template.administration.helpers({
  users: () => Meteor.users.find({}, { sort: { createdAt: -1 } }),
  avatar: (meteorUser) => displayUserAvatar(meteorUser),
  dayjs: (date) => dayjs(date).format('DD.MM.YYYY (HH:mm)'),
  globalsettings: () => Globalsettings.find(),
  stringify: (string) => string.toString(),
  isTextArea: (setting) => setting.type === 'textarea',
  extensions: () => (Extensions.find({}).fetch().length > 0 ? Extensions.find({}) : false),
  customfields: () => (CustomFields.find({}).fetch().length > 0 ? CustomFields.find({}) : false),
  getClassName: (name) => i18next.t(`globals.${name}`),
})

Template.administration.events({
  'click .js-delete': (event, templateInstance) => {
    event.preventDefault()
    if (confirm(i18next.t('administration.user_deletion_confirmation'))) {
      Meteor.call('adminDeleteUser', { userId: templateInstance.$(event.currentTarget).data('id') }, (error, result) => {
        if (error) {
          console.error(error)
        } else {
          showToast(i18next.t('administration.user_deleted'))
        }
      })
    }
  },
  'click #js-create-user': (event, templateInstance) => {
    event.preventDefault()
    const name = templateInstance.$('#name').val()
    const email = templateInstance.$('#email').val()
    const password = templateInstance.$('#password').val()
    const isAdmin = templateInstance.$('#isAdmin').is(':checked')
    const currentLanguageProject = i18next.t('globals.project')
    const currentLanguageProjectDesc = i18next.t('project.first_project_desc')
    if (!validateEmail(email)) {
      templateInstance.$('#email').addClass('is-invalid')
      return
    }
    if (name && email && password) {
      Meteor.call('adminCreateUser', {
        name, email, password, isAdmin, currentLanguageProject, currentLanguageProjectDesc,
      }, (error) => {
        if (error) {
          console.error(error)
          showToast(error.message)
        } else {
          templateInstance.$('#name').val('')
          templateInstance.$('#email').val('')
          templateInstance.$('#password').val('')
          templateInstance.$('#isAdmin').prop('checked', false)
          showToast(i18next.t('administration.user_created'))
        }
        templateInstance.$('#email').removeClass('is-invalid')
      })
    }
  },
  'click .js-make-admin': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('adminToggleUserAdmin', { userId: templateInstance.$(event.currentTarget).data('id'), isAdmin: true }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(i18next.t('administration.user_updated'))
      }
    })
  },
  'click .js-remove-admin': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('adminToggleUserAdmin', { userId: templateInstance.$(event.currentTarget).data('id'), isAdmin: false }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(i18next.t('administration.user_updated'))
      }
    })
  },
  'click .js-generate-password': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('#password').val(Random.id())
  },
  'click #reset': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('resetSettings', (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(i18next.t('notifications.settings_saved_success'))
      }
    })
  },
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    const settingsArray = []
    for (const element of templateInstance.$('.js-setting-input')) {
      const { name } = element
      let value = templateInstance.$(element).val()
      if (element.type === 'number') {
        value = Number(value)
      } else if (value === 'true') {
        value = true
      } else if (value === 'false') {
        value = false
      }
      settingsArray.push({ name, value })
    }
    Meteor.call('updateGlobalSettings', settingsArray, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(i18next.t('notifications.settings_saved_success'))
      }
    })
  },
  'click .js-reset': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('resetGlobalsetting', { name: templateInstance.$(event.currentTarget).data('setting-name') }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(i18next.t('notifications.settings_saved_success'))
      }
    })
  },
  'change #extensionFile': (event, templateInstance) => {
    event.preventDefault()
    const file = event.currentTarget.files[0]
    const reader = new FileReader()
    if (file && reader) {
      reader.readAsDataURL(file)
      reader.onload = () => {
        const zipFile = reader.result
        Meteor.call('addExtension', { zipFile }, (error, result) => {
          if (error) {
            console.error(error)
          } else {
            showToast(i18next.t(result))
          }
        })
      }
    }
  },
  'click .js-remove-extension': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('removeExtension', { extensionId: templateInstance.$(event.currentTarget).data('extension-id') }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(i18next.t('administration.extension_removed'))
      }
    })
  },
  'click .js-launch-extension': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('launchExtension', { extensionId: templateInstance.$(event.currentTarget).data('extension-id') }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(i18next.t('administration.extension_launched'))
      }
    })
  },
  'change .js-extension-state': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('toggleExtensionState', { extensionId: templateInstance.$(event.currentTarget).data('extension-id'), state: templateInstance.$(event.currentTarget).is(':checked') }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(i18next.t('notifications.success'))
      }
    })
  },
  'click .js-create-customfield': (event, templateInstance) => {
    event.preventDefault()
    const name = templateInstance.$('#customfieldName').val()
    const desc = templateInstance.$('#customfieldDesc').val()
    const type = templateInstance.$('#customfieldType').val()
    const classname = templateInstance.$('#customfieldClassname').val()
    const possibleValues = templateInstance.$('#customfieldPossibleValues').val().split(',')
    if (!name) {
      templateInstance.$('#customfieldName').addClass('is-invalid')
      return
    }
    if (!desc) {
      templateInstance.$('#customfieldDesc').addClass('is-invalid')
      return
    }
    if (!type) {
      templateInstance.$('#customfieldType').addClass('is-invalid')
      return
    }
    if (!classname) {
      templateInstance.$('#customfieldClassname').addClass('is-invalid')
      return
    }
    templateInstance.$('.form-control').removeClass('is-invalid')
    Meteor.call('addCustomField', {
      name,
      desc,
      type,
      classname,
      possibleValues,
    }, (error) => {
      if (error) {
        console.error(error)
      } else {
        templateInstance.$('#customfieldName').val('')
        templateInstance.$('#customfieldDesc').val('')
        templateInstance.$('#customfieldClassname').val('')
        showToast(i18next.t('notifications.success'))
      }
    })
  },
  'click .js-remove-customfield': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('removeCustomField', {
      _id: templateInstance.$(event.currentTarget).data('customfield-id'),
    }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(i18next.t('notifications.success'))
      }
    })
  },
})
