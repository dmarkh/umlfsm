/*
 * UML Finite State Machine - UmlFsm
 *
 * Author: Dmitry Arkhipkin, <arkhipkin@gmail.com>
 *
 * UmlFsm is the event-driven, hierarchical finite state machine, which
 * implements features of the ![UML State Machine](https://en.wikipedia.org/wiki/UML_state_machine):
 *  - hierarchical nested states and orthogonal regions
 *  - internal, local and external transitions between states
 *  - entry / exit actions
 *  - extended states, guard conditions, actions
 *  - run-to-completion execution model: event queue, deferred event queue
 *
 * Also, it features:
 *  - transitions guided by state history
 *  - async / await for all actions
 *  - rudimentary export of the FSM to graphviz format
 */

/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Dmitry Arkhipkin
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * @fileOverview UmlFsm - Finite State Machine in javascript
 * @author Dmitry Arkhipkin, arkhipkin@gmail.com
 * @version 1.0.0
 */

/**
 * UmlFsmState class
 * @class UmlFsmState
 */
class UmlFsmState {

	/**
	 * UmlFsmState constructor
	 * @constructs UmlFsmState
	 * @param {string} id - state id
	 * @param {boolean} parallel - is state orthogonal/parallel or regular?
	 * @param {UmlFsmState} parent - parent state, if exists
	 * @param {UmlFsmState} top - top state of FSM, if exists
	 * @param {string[]} defer - list of deferred event ids
	 * @param {boolean} debug - debug flag
	 */
	constructor({ id = '_fsm_', parallel = false, parent = false, top = false,
					defer = [], debug = false }) {
		this._fsmst = {
			"mId": id,
			"mParent": parent,
			"mTop": top || this,
			"mIsParallel": parallel,
			"mLastActiveState": false,
			"mChildren": [],
			"mOnEntry": false,
			"mOnExit": false,
			"mTransitions": {},
			"mDeferredEvents": defer,
			"mEnabled": false,
			"log": debug || function(){}
		};
	}

	/**
	 * Get state id
	 * @return {string} state id
	 */
	get _fsm_id() {
		return this._fsmst.mId;
	}

	/**
     * Get parent state
     * @return {UmlFsmState} state
     */
	get _fsm_parent() {
		return this._fsmst.mParent;
	}

	/**
     * Set parent state
     * @param {UmlFsmState} state
     */
	set _fsm_parent( state ) {
		this._fsmst.mParent = state;
	}

	/**
     * Get child states
     * @return {UmlFsmState[]} children
     */
	get _fsm_children() {
		return this._fsmst.mChildren;
	}

	/**
     * Get transitions for the state
     * @return {Object[]} transitions
     */
	get _fsm_transitions() {
		return this._fsmst.mTransitions;
	}

	/**
     * Get state type
     * @return {boolean} status
     */
	get _fsm_is_parallel() {
		return this._fsmst.mIsParallel;
	}

	/**
     * Get state type
     * @return {boolean} status
     */
	get _fsm_is_nested() {
		return ( this._fsm_children.length > 0 );
	}

	/**
     * Get path from this state to the top-level machine
     * @return {string} path
     */
    get _fsm_path() {
		let path = [ this ];
		while ( path[ 0 ]._fsm_parent ) {
			path.unshift( path[ 0 ]._fsm_parent );
		}
		return path;
    }

	/**
     * Get level of hierarchy for this state
     * @return {number} depth
     */
    get _fsm_depth() {
		return this._fsm_path.length;
    }

	/**
     * If state is nested, get preferred child
	 * @param {boolean} history - should state return preferred child using history?
     * @return {UmlFsmState} state
     */
	_fsm_preferred_child( history = false ) {
		return ( ( history === true && this._fsmst.mLastActiveState ) ? this._fsmst.mLastActiveState : this._fsm_children[ 0 ] );
	}

	/**
     * Get top-level node for this state
     * @return {UmlFsmState} state
     */
	get _fsm_top() {
		return this._fsmst.mTop;
	}

	/**
     * Set top-level node for this state and its children
     * @param {UmlFsmState} state
     */
	set _fsm_top( state ) {
		this._fsmst.mTop = state;
		for ( let child of this._fsm_children ) {
			child._fsm_top = state;
		}
	}

	/**
	 * entry callback function
	 *
	 * @callback entryCallback
	 * @param {Object} args - event parameters
	 * @param {Object} extended_state - extended state object
	 */

	/**
	 * exit callback function
	 *
	 * @callback exitCallback
	 * @param {Object} args - event parameters
	 * @param {Object} extended_state - extended state object
	 */

	/**
	 * Set entry callback which is executed when state is entered by State Machine
	 * @param {entryCallback} cb - the user callback that handles the entry
	 */
	set _fsm_entry_callback( cb ) {
		this._fsmst.mOnEntry = cb;
	}

	/**
	 * Set exit callback which is executed when state is exited by State Machine
	 * @param {exitCallback} cb - the user callback that handles the exit
	 */
	set _fsm_exit_callback( cb ) {
		this._fsmst.mOnExit = cb;
	}

	/**
	 * Reference to the direct child state which was entered last
	 * @param {UmlFsmState} state - child state
	 */
	set _fsm_last_active_state( state ) {
		this._fsmst.mLastActiveState = state;
	}

	/**
	 * Directly create a descendant state - transforms simple state into nested
	 * @param {string} id - state id
	 * @param {boolean} parallel - indicate if state needs to be orthogonal / parallel
	 * @param {string[]} defer - list of events which need to be deferred
	 * @param {boolean} debug - indicate if state needs to enable debug mode
     * @return {UmlFsmState} state - newly created child state
	 */
	_fsm_create_child_state({ id, parallel = false, defer = [], debug = false }) {
		let child = new UmlFsmState({ id, parallel, "parent": this, "top": this._fsm_top, defer, "debug": debug });
		this._fsm_children.push( child );
		return child;
	}

	/**
	 * Adopt a state created indirectly. Transforms this state into nested state.
	 * @param {UmlFsmState} state - adopted state
     * @return {UmlFsmState} state - this state, to allow call chaining
	 */
	_fsm_adopt_child_state( state ) {
		state._fsm_parent = this;
		state._fsm_top = this._fsm_top;
		this._fsm_children.push( state );
		return this;
	}

	/**
	 * Handler for the entry callbacks
	 * @param {Object} args - event parameters
	 */
	_fsm_on_entry( args ) {
		this._fsmst.mEnabled = true;
		if ( this._fsmst.mOnEntry ) {
			return this._fsmst.mOnEntry({ args, "state": this, "extended_state": this._fsm_top._fsm_extended_state });
		}
	}

	/**
	 * Handler for the exit callbacks
	 * @param {Object} args - event parameters
	 */
	_fsm_on_exit( args ) {
		this._fsmst.mEnabled = false;
		if ( this._fsmst.mOnExit ) {
			return this._fsmst.mOnExit({ args, "state": this, "extended_state": this._fsm_top._fsm_extended_state });
		}
	}


	/**
	 * guard callback function
	 *
	 * @callback guardCallback
	 * @param {Object} args - event parameters
	 * @param {Object} extended_state - extended state object
	 */

	/**
	 * action callback function
	 *
	 * @callback actionCallback
	 * @param {Object} args - event parameters
	 * @param {Object} extended_state - extended state object
	 */

	/**
	 * Adds transition object to the list of transitions of this state
	 * @param {string} event_id - event name
	 * @param {UmlFsmState} target - target state of the transition
	 * @param {guardCallback} guard - user-supplied function, must evaluate to true to allow transition
	 * @param {actionCallback} action - user-supplied function to be executed after exits and before entries
	 * @param {string} type - transition type: external, internal, local
	 * @param {boolean} history - enable transition via history of the target state ( assumed to be nested or orthogonal )
	 */
	_fsm_add_transition({ event_id, target, guard = false, action = false, type = 'external', history = false, prefer = [] }) {
		if ( !this._fsm_transitions[ event_id ] ) {
			this._fsm_transitions[ event_id ] = [{ target, guard, action, type, history, prefer }];
		} else {
			this._fsm_transitions[ event_id ].push({ target, guard, action, type, history, prefer });
		}
	}

	/**
	 * Get transition object from the list of transitions of this state
	 * @param {string} event_id - event name
     * @return {Object[]} transitions - array of transition objects defined for a state
	 */
	_fsm_get_transition( event_id ) {
		return this._fsmst.mTransitions[ event_id ];
	}

	/**
	 * Check if this state has a transition with name event_id
	 * @param {string} event_id - event name
     * @return {boolean} yes/no
	 */
	_fsm_has_transition( event_id ) {
		return ( this._fsm_transitions[ event_id ] ? true : false );
	}

	/**
	 * Check if this state has the event in the list of deferred events
	 * @param {string} event_id - event name
     * @return {boolean}
	 */
	_fsm_has_deferred( event_id ) {
		return this._fsmst.mDeferredEvents.includes( event_id );
	}

	/**
	 * Descend by path of states and collect all participating states for entry purposes
	 * @param {Set} need_entry - resulting array of states
	 * @param {UmlFsmState[]} path - path from top state to the bottom state
	 * @param {boolean} history - should history be used for descend
	 * @param {UmlFsmState[]} prefer - preferred final states ( aka pseudo-state split )
	 */
	_fsm_descend_preferred( need_entry, path = [], history = false, prefer = [] ) {
		this._fsmst.log(`checking descend for state ${this._fsm_id}` );
		// simple state, no need to descend
		if ( this._fsm_is_nested === false ) {
			this._fsmst.log( `${this._fsm_id} - not nested, stop descend` );
			return;
		}
		// parallel state, descend using all children
		if ( this._fsm_is_parallel === true ) {
			this._fsmst.log( `${this._fsm_id} - is parallel, descending by all children` );
			// strip this state from path and preferred paths if exits
			for ( let child of this._fsm_children ) {
				if ( path.length > 0 && path[ 0 ] === child ) {
					path.shift();
				}
				if ( prefer.length > 0 ) {
					for( let prefer_path of prefer ) {
						if ( prefer_path.length > 0 && prefer_path[ 0 ] === child ) {
							prefer_path.shift();
						}
					}
				}
				need_entry.add( child );
				child._fsm_descend_preferred( need_entry, path, history, prefer );
			}
		} else {
			this._fsmst.log( `${this._fsm_id} - is nested, descending by preferred child` );
			// nested state, descend using path, or history
			if ( path.length > 0 || history === true ) {
				let preferred_child = path.length > 0 ? path.shift() : this._fsm_preferred_child( history );
				this._fsmst.log( `descending by path or history to ${preferred_child._fsm_id} `);
				for ( let child of this._fsm_children ) {
					if ( child === preferred_child ) {
						for( let prefer_path of prefer ) {
							if ( prefer_path.length > 0 && prefer_path[ 0 ] === child ) {
								prefer_path.shift();
							}
						}
						need_entry.add( child );
						child._fsm_descend_preferred( need_entry, path, history, prefer );
					}
				}
			} else {
				this._fsmst.log( `descending by preferred or default from ${this._fsm_id}` );
				let found_preferred = ( () => {
					for ( let child of this._fsm_children ) {
						for( let preferred_path of prefer ) {
							if ( preferred_path.length > 0 && child === preferred_path[ 0 ] ) {
								return child;
							}
						}
					}
					return false;
				} )();

				if ( found_preferred ) {
					this._fsmst.log('descending by preferred ');
					// remove found child from prefer lists
					for( let prefer_path of prefer ) {
						if ( prefer_path.length > 0 && prefer_path[ 0 ] === found_preferred ) {
							prefer_path.shift();
						}
					}
					// remove child from prefer
					need_entry.add( found_preferred );
					found_preferred._fsm_descend_preferred( need_entry, path, history, prefer );
				} else {
					this._fsmst.log('descending by default');
					// descend via first child
					let child = this._fsm_preferred_child( false );
					need_entry.add( child );
					child._fsm_descend( need_entry, path, history );
				}
			}
		}
	}

	/**
	 * Descend by path of states and collect all participating states for entry purposes
	 * @param {Set} need_entry - resulting array of states
	 * @param {UmlFsmState[]} path - path from top state to the bottom state
	 * @param {boolean} history - should history be used for descend
	 */

	_fsm_descend( need_entry, path = [], history = false ) {
		let queue = [{ "state": this, path }], val;
		while ( val = queue.shift() ) {
			if ( val.state._fsm_is_nested === false ) {
				continue;
			}
        	let preferred_child = val.path.length > 0 ? val.path.shift() : val.state._fsm_preferred_child( history );
	        for ( let child of val.state._fsm_children ) {
    	        if ( child === preferred_child ) {
					need_entry.add( child );
            	    queue.push({ "state": child, "path": val.path });
            	} else if ( val.state._fsm_is_parallel === true ) {
					need_entry.add( child );
                	queue.push({ "state": child, "path": [] });
            	}
        	}
		}
    }

	/**
	 * Convert current state of the FSM (tree-like) into plain string
     * @return {string} - path like fsm/running/state1 or /fsm/running/(state1|state2)
	 */
	_fsm_get_active_state_as_string() {
		if ( this._fsm_is_parallel === true ) {
			return ( this._fsm_id + '/(' + ( this._fsm_children.map( (child) => {
				return child._fsm_get_active_state_as_string();
			}).join('|') ) + ')' );
		} else if ( this._fsm_is_nested === true ) {
			for ( let child of this._fsm_children ) {
				if ( child._fsmst.mEnabled === true ) {
					return ( this._fsm_id + '/' + child._fsm_get_active_state_as_string() );
				}
			}
		} else {
			return this._fsm_id;
		}
	}
}


/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Dmitry Arkhipkin
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * UmlFsm class
 * @class UmlFsm
 */
class UmlFsm extends UmlFsmState {

	/**
	 * UmlFsm constructor
	 * @constructor
	 */
	constructor({ id = '_fsm_', parallel = false, defer = [], debug = false, extended_state = {} }) {
		super({ id, parallel, defer, debug });
		this._fsm_parent = false;
		this._fsm_top = this;
		this._fsm = {
			"mEventQueue": [],
			"mDeferredEventQueue": [],
			"mEventInProgress": false,
			"mActiveStates": new Set(),
			"mExtendedState": extended_state,
			"mFlags": { "dropped": 0, "deferred": 1, "internal": 2, "local": 3, "external": 4 }
		};
	}

	/**
     * Get extended state for the top-level FSM
     * @return {Object} extended_state
     */
	get _fsm_extended_state() {
		return this._fsm.mExtendedState;
	}

	/**
     * Add state to the Set of active states
	 * @param {UmlFsmState} state - added state
     */
	_fsm_add_active_state( state ) {
		this._fsm.mActiveStates.add( state );
	}

	/**
     * Remove state from the Set of active states
	 * @param {UmlFsmState} state - removed state
     */
	_fsm_remove_active_state( state ) {
		this._fsm.mActiveStates.delete( state );
	}

	/**
     * Emit event
	 * @param {string} event_id - event id
	 * @param {Object} args - event parameters
	 * @return {Promise} - promise to be resolved when event is either queued or processed
     */
	async _fsm_emit_event({ event_id = false, args = {} }) {
		this._fsm.mEventQueue.push({ event_id, args });
		if ( this._fsm.mEventInProgress === true ) {
			this._fsmst.log( 'queuing event "' + event_id + '"');
			return;
		}
		return this._fsm_process_events();
	}

	/**
     * Process events from the event queue
	 */
	async _fsm_process_events() {
		this._fsm.mEventInProgress = true;
		while ( this._fsm.mEventQueue.length > 0 ) {
			// process event
			let rc = await this._fsm_process_event( this._fsm.mEventQueue.shift() );

			// check deferred queue after successful state change
			if ( rc === this._fsm.mFlags.external && this._fsm.mDeferredEventQueue.length > 0 ) {
				this._fsmst.log('deferred events in queue: ' + this._fsm.mDeferredEventQueue.length );
				let temp_deferred = this._fsm.mDeferredEventQueue.slice();
				this._fsm.mDeferredEventQueue = [];
				do {
					await this._fsm_process_event( temp_deferred.shift() );
				} while( temp_deferred.length > 0 );
			}

		}

		this._fsm.mEventInProgress = false;
	}

	/**
     * Process event from the queue. Event may end up being deferred.
	 * @param {string} event_id - event id
	 * @param {Object} args - event parameters
	 */
	async _fsm_process_event({ event_id, args }) {
		this._fsmst.log( 'executing event "' + event_id + '", args: ', args );
		// start checking active states for transitions bottom up
		let last_transition_states = new Set(),
			temp_active_states = [ ...this._fsm.mActiveStates];
		for ( let state of temp_active_states ) {
			// check reversed state path for possible transitions
			for ( let pstate of state._fsm_path.reverse() ) {
				// multi-state event processing abort to avoid firing same state transition multiple times
				if ( last_transition_states.has( pstate ) ) {
					break;
				}
				// state defers event?
				if ( pstate._fsm_has_deferred( event_id ) === true ) {
					this._fsm.mDeferredEventQueue.push({ event_id, args });
					this._fsmst.log('event "' + event_id + '" was deferred by state "' + pstate._fsm_id + '"');
					return this._fsm.mFlags.deferred;
				}
				// state has no transition for this event
				if ( pstate._fsm_has_transition( event_id ) === false ) {
					continue;
				}
				// okay, transition found, processing
				let transitions = pstate._fsm_get_transition( event_id );
				// multi-transition event (aka choice)
				if ( Array.isArray( transitions ) === true ) {
					for ( let trans of transitions ) {
						// is transition guarded?
						if ( trans.guard === false || trans.guard({ args, "extended_state": this._fsm_extended_state }) === true ) {
							last_transition_states.add( pstate );
							await this._fsm_perform_transition({ "from": pstate, "to": trans, args });
							break;
						}
					}
					if ( last_transition_states.has( pstate ) ) {
						break;
					}
				// single transition, but could be guarded
				} else if ( transitions.guard === false || transitions.guard({ args, "extended_state": this._fsm_extended_state }) === true ) {
					last_transition_states.add( pstate );
					await this._fsm_perform_transition({ "from": pstate, "to": transitions, args });
					break;
				}
			}
		}
		if ( last_transition_states.length === 0 ) {
			this._fsmst.log('event "' + event_id + '" is not allowed in current state, skipping');
			return this._fsm.mFlags.skipped;
		}
		return this._fsm.mFlags.external;
	}

	/**
     * Get list of states that need to be exited from
	 * @param {UmlFsmState} lca - Least Common Ancestor state
     * @return {UmlFsmState[]} states - exit states
	 */
	_fsm_get_exits( lca ) {
		let need_exit = [], exit_states = new Set();
		// exit from 'from' state up to LCA
		for ( let state of this._fsm.mActiveStates ) {
			if ( this._fsm_has_parent( state, lca ) === true ) {
				need_exit.push( state );
			}
		}
		need_exit.forEach( ( state ) => {
			let path = state._fsm_path,
				ind = path.indexOf( lca );
			for ( let i = path.length - 1; i > ind; i-- ) {
				exit_states.add( path[ i ] );
			}
		});

		return [ ...exit_states ].sort( ( a, b ) => {
			return b._fsm_depth - a._fsm_depth;
		});
	}

	/**
     * Get list of states that need to be entered
	 * @param {Object} to - object, which contains to state, prefer, etc..
	 * @param {UmlFsmState} lca - Least Common Ancestor state
     * @return {UmlFsmState[]} states - entry states
	 */
	_fsm_get_entries( to, lca ) {
		let path = to.target._fsm_path,
			idx = path.indexOf( lca ), entry_states = new Set();
		// strip path of everything above LCA
		path.splice( 0, idx );
		// select entries
		// check if preferred paths provided
		if ( to.prefer.length > 0 ) {
			for ( let i = 0, ilen = to.prefer.length; i < ilen; i++ ) {
				// strip target.path from preferred path
				let ppath = to.prefer[ i ]._fsm_path;
				ppath.splice( 0, ppath.indexOf( to.target ) + 1 );
				to.prefer[ i ] = ppath;
			}
			this._fsmst.log( 'preferred paths: ', to.prefer );
		}
		if ( to.prefer.length > 0 ) {
			this._fsmst.log('descend preferred');
			( path.shift() )._fsm_descend_preferred( entry_states, path, to.history, to.prefer );
		} else {
			this._fsmst.log('descend fast');
			( path.shift() )._fsm_descend( entry_states, path, to.history );
		}
		// sort entrances by depth, asc
   	    return [ ...entry_states ].sort( ( a, b ) => {
       	    return a._fsm_depth - b._fsm_depth;
        });
	}

	/**
     * Perform transition from state 'from' to state 'to.target'
	 * @param {UmlFsmState} from - 'from' state
	 * @param {Object} to - Object, containing to.target = 'to' state, to.type - transition type, to.action - action callback
	 * @param {Object} args - event parameters
	 * @return {string} flag - transition flag
	 */
	async _fsm_perform_transition({ from, to, args }) {

		this._fsmst.log( 'performing ' + ( to.type || 'external' ) + ' transition "' + from._fsm_id + '" to "' + ( to.target ? to.target._fsm_id : this._fsm_id ) + '", args: ', args );

		// check internal transition first
		if ( to.type === 'internal' ) {
			// internal transitions do not change state of FSM, but action must be executed if provided
			if ( to.action ) {
				await to.action({ args, "extended_state": this._fsm_extended_state });
			}
			return this._fsm.mFlags.internal;
		}

		// find exits

		// find least common ancestor LCA
		let lca = this._fsm_get_lca({ "state_from": from, "state_to": to.target, "local": ( to.type === 'local' ) }),
			exit_states = [], entry_states = [];

		this._fsmst.log('least common ancestor: ', lca );

		exit_states = this._fsm_get_exits( lca );

		this._fsmst.log('exit states', exit_states);

		entry_states = this._fsm_get_entries( to, lca );

		this._fsmst.log( 'entry_states', entry_states );

		// perform exits
		for ( let state of exit_states ) {
			await state._fsm_on_exit( args );
		}

		// perform action if supplied
		if ( to.action ) {
			await to.action({ args, "extended_state": this._fsm_extended_state });
		}

		// perform entries
		for ( let state of entry_states ) {
			await state._fsm_on_entry( args );
			if ( state._fsm_parent._fsm_is_nested === true ) {
				state._fsm_parent._fsm_last_active_state = state;
			}
		}

		// filter out nested and parallel states, leave active states
		entry_states = entry_states.filter( (state) => {
			return ( state._fsm_is_nested === false );
		});

		// clear out any active states that may have existed
		exit_states.forEach( (state) => {
			this._fsm_remove_active_state( state );
		});

		// set remaining states as active states
		entry_states.forEach( ( state ) => {
			this._fsm_add_active_state( state );
		});

		this._fsmst.log( 'active states: ', this._fsm.mActiveStates );

		return this._fsm.mFlags.external;
	}


	/**
     * Get Least Common Ancestor for the transition between two states
	 * @param {UmlFsmState} state1 - to/from state
	 * @param {UmlFsmState} state2 - to/from state
	 * @param {boolean} local - is transition local or external?
	 * @return {UnlFsmState} - lca state
	 */
	_fsm_get_lca({ state_from, state_to, local = false }) {
		let path_from = state_from._fsm_path,
			path_to = state_to._fsm_path;
		// check top-level self-transition
		if ( ( state_from === state_to ) && path_from.length === 1 ) {
			return state_from;
		}
		// proceed with LCA search
		for( let i = 0, ilen = Math.min( path_from.length, path_to.length ); i < ilen; i++ ) {
			if ( path_from[ i ] !== path_to[ i ] ) {
				// external transition, found LCA
				return path_from[ i - 1 ];
			} else if ( path_from[ i ] === path_to[ i ] && ( path_from[ i + 1 ] === undefined || path_to[ i + 1 ] === undefined ) ) {
				if ( local ) {
					// local transition: target state is a substate of main state or vice versa, LCA = one of states
					return path_from[ i ];
				}
				// external transition
				return path_from[ i - 1 ];
			}
		}
		// should never get here
		this._fsmst.log('WARN: LCA not found?');
		return false;
	}

	/**
     * Check if specific state has a specific parent in the hierarchy
	 * @param {UmlFsmState} state - tested state
	 * @param {UmlFsmState} parent - potential parent
	 * @return {boolean} - yes / no
	 */
	_fsm_has_parent( state, parent ) {
		return ( ( state._fsm_path ).indexOf( parent ) !== -1 );
	}

	/**
     * Start FSM, perform initial default transition and process queued events happened during this transition
	 */
	async _fsm_start() {
		this._fsm.mEventInProgress = true;

		// clear out any active states that may have existed
		this._fsm.mActiveStates.clear();

		// select states which need to be entered
		let need_entry = new Set();
		need_entry.add( this );
		this._fsm_descend( need_entry );

		// sort entrances by depth, asc
        need_entry = [ ...need_entry ].sort( ( a, b ) => {
            return a._fsm_depth - b._fsm_depth;
        });

		// enter states ordered by depth
		for ( let state of need_entry ) {
			await state._fsm_on_entry({});
		}

		// filter out nested and parallel states
		need_entry = need_entry.filter( (state) => {
			return ( state._fsm_is_nested === false );
		});

		// set remaining states as active states
		need_entry.forEach( ( state ) => {
			this._fsm_add_active_state( state );
		});

		return this._fsm_process_events();
	}

	/**
     * Export state machine into visualization-ready format. Rudimentary! Many FSM features are not supported.
	 * @return {string} - graphviz text in dot format
	 */
	_fsm_export_as_graphviz() {
		let str = [], need_h = new Set();
		str.push( 'digraph FSM {', 'rankdir=LR;', 'node [shape=circle,fontsize=10,margin=0.005];', 'edge [fontsize=8];', 'graph [fontsize=10,ranksep=0.05, nodesep=0.05]', 'compound=true;' );
		str.push( 'START [shape=point,width=0.3,height=0.3];' );
		this._fsm_descend_graphviz_transitions( this, str, need_h );
		this._fsm_descend_graphviz_nodes( this, str, 0, need_h );
		str.push( '}' );
		return str.join("\n");
	}

	/**
     * Helper utility, traverses states and creates graphviz descriptions
	 * @param {UmlFsmState} state - current state
	 * @param {string} str - graphviz text
	 * @param {number} depth - depth of currently rraversed state
	 * @param {Set} need_h - Set of states which need history transition support in graphviz
	 */
	_fsm_descend_graphviz_nodes( state, str, depth = 0, need_h ) {
		let offset = new Array( depth * 4 ).join( ' ' ), postoffset = new Array( ( depth + 1 ) * 4 ).join(' ');
		if ( state._fsm_is_nested === true ) {
			str.push( offset + 'subgraph cluster' + state._fsm_id + ' {' );
			str.push( postoffset + 'label = "' + state._fsm_id + '";' );
			str.push( postoffset + 'style="rounded";' );
			str.push( postoffset + state._fsm_id + ' [shape=none,label="",width=0,height=0];' );
			if ( need_h.has( state ) ) {
				str.push( postoffset + 'H_' + state._fsm_id + ' [shape=square,style=dashed,width=0.3,height=0.3,label="H"];' );
			}
			for( let child of state._fsm_children ) {
				this._fsm_descend_graphviz_nodes( child, str, depth + 1, need_h );
			}
			str.push( offset + '};' );
		} else {
			str.push( offset + state._fsm_id + ( Object.keys(state._fsm_transitions).length === 0 ? ' [shape=doublecircle,style="filled"];' : ';' ) );
		}
	}

	/**
     * Helper utility, traverses states and creates the list of transitions
	 * @param {UmlFsmState} state - current state
	 * @param {string} str - graphviz text
	 * @param {Set} need_h - Set of states which need history transition support in graphviz
	 */
	_fsm_descend_graphviz_transitions( state, str, need_h ) {
		let offset = new Array( 4 ).join( ' ' );
		if ( state._fsm_parent === false ) {
			str.push( offset + 'START -> ' + state._fsm_children[ 0 ]._fsm_id + ( state._fsm_children[ 0 ]._fsm_is_nested ? '[lhead=cluster' + state._fsm_children[ 0 ]._fsm_id + ']' : '' ) + ';' );
		}
		for ( let trankey in state._fsm_transitions ) {
			if ( !state._fsm_transitions.hasOwnProperty( trankey ) ) {
				continue;
			}
			for ( let tran of state._fsm_transitions[ trankey ] ) {
				if ( tran.target ) {
					str.push( offset + state._fsm_id + ' -> ' + ( tran.history ? 'H_' : '') + tran.target._fsm_id + '[' + ( state._fsm_is_nested ? ('ltail=cluster' + state._fsm_id + ',') : '' ) + 'label="' + trankey + '"];' );
				} else {
					str.push( offset + state._fsm_id + ' -> ' + state._fsm_id + '[label="' + trankey + '"];' );
				}
				if ( tran.history ) {
					need_h.add( tran.target );
				}
			}
		}
		for ( let child of state._fsm_children ) {
			this._fsm_descend_graphviz_transitions( child, str, need_h );
		}
	}

}

export { UmlFsm, UmlFsmState };
