import _ from 'lodash';

/**
 * Special Initialization Case:  When groupId is null and there is no sender, assume they meant the first group available
 * @param {object} state
 * @param {object} action
 * @param {object} item
 * @returns {object}
 */
function addItem(state, action, item) {
  const isInitializationCase = state.length > 0 && action.groupId === null && !action.senderName,
    groupId = isInitializationCase ? state[0].groupId : action.groupId,
    groupIndex = _.findIndex(state, {groupId});

  console.log('addItem', {groupId, groupIndex, item, state, action});

  if (groupIndex > -1) {
    state = state.updateIn([groupIndex, 'tabs'], tabs => {
      return tabs.concat([item]);
    });

    state = state.setIn([groupIndex, 'active'], item.id);
  }

  return state;
}

/**
 * @param {Immutable} state
 * @param {object} action
 * @returns {Immutable}
 */
function focus(state, action) {
  const groupId = action.groupId,
    groupIndex = _.findIndex(state, {groupId});

  // if we own the group
  if (groupIndex !== -1) {
    const id = action.id,
      tabIndex = _.findIndex(state[groupIndex].tabs, {id});

    if (tabIndex !== -1) {
      state = state.setIn([groupIndex, 'active'], id);
    }
  }

  return state;
}

/**
 * @param {Array} state
 * @param {object} action
 * @returns {Array}
 */
function close(state, action) {
  const groupId = action.groupId,
    id = action.id,
    groupIndex = _.findIndex(state, {groupId});

  if (groupIndex > -1) {
    const tabs = state[groupIndex].tabs,
      tabIndex = _.findIndex(state[groupIndex].tabs, {id});

    // only allow removal if they have more than one item
    if (tabs.length > 1) {
      state = state.updateIn([groupIndex, 'tabs'], tabs =>  tabs.filter(tab => tab.id !== id));

      if (state[groupIndex].active === id) {
        let newActive;

        if (tabIndex === 0 && tabs[1]) {
          newActive = tabs[1].id;
        } else {
          newActive = tabs[tabIndex - 1].id;
        }

        state = state.setIn([groupIndex, 'active'], newActive);
      }
    }
  }

  return state;
}

function closeActive(state, action) {
  const groupId = action.groupId,
    groupIndex = _.findIndex(state, {groupId});

  if (groupIndex > -1) {
    state = close(state, _.assign({id: state[groupIndex].active}, action));
  }

  return state;
}

/**
 * @param {Immutable} state
 * @param {string} propertyName
 * @param {*} value
 * @param {function} [transform]
 * @returns {object}
 */
function changeProperty(state, propertyName, value, transform) {
  if (transform) {
    value = transform(value);
  }

  _.each(state, (group, groupIndex) => {
    _.each(group.tabs, (tab, tabIndex) => {
      state = state.setIn([groupIndex, 'tabs', tabIndex, 'content', propertyName], value);
    });
  });

  return state;
}

function getGroupIndex(state, action) {
  // if we have a groupId, find it
  if (_.isString(action.groupId)) {
    const groupId = action.groupId;

    return _.findIndex(state, {groupId});
  }

  // if we have at least one item, use the first item
  if (_.isArray(state) && state.length) {
    return 0;
  }

  // no groups available here
  return -1;
}

export default {
  addItem,
  close,
  closeActive,
  focus,
  changeProperty,
  getGroupIndex
};
