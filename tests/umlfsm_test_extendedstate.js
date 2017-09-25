import { UmlFsm } from '../umlfsm';

import Test from './test.js';
let t = new Test('extended state');

export default async function umlfsm_test_extendedstate() {
	// console.log('--- UmlFsm test --- extended state ---');

	// main state machine
	let FSM = new UmlFsm({ id: 'KEYBOARD', extended_state: { key_count: 5 } });

	// setup states
	let DEFAULT = FSM._fsm_create_child_state({ id: 'DEFAULT' }),
		CAPSLOCKED = FSM._fsm_create_child_state({ id: 'CAPSLOCKED' }),
		STOPPED = FSM._fsm_create_child_state({ id: 'STOPPED' });

	// setup transitions
	DEFAULT._fsm_add_transition({ event_id: 'capslock', target: CAPSLOCKED });
	CAPSLOCKED._fsm_add_transition({ event_id: 'capslock', target: DEFAULT });

	// pseudo-state: choice between guarded external and unguarded internal transitions
	DEFAULT._fsm_add_transition({ event_id: 'any_key', target: STOPPED,
		guard: function({ args, extended_state }) {
			return extended_state.key_count === 0;
		}
	});
	DEFAULT._fsm_add_transition({ event_id: 'any_key', type: 'internal',
		action: function({ args, extended_state }) {
			--extended_state.key_count;
			// console.log( 'emit code: '+ args.code +', lower-case: ' + String.fromCharCode( args.code ).toLowerCase() );
		}
	});

	// pseudo-state: choice between guarded external and unguarded internal transitions
	CAPSLOCKED._fsm_add_transition({ event_id: 'any_key', target: STOPPED,
		guard: function({ args, extended_state }) {
			return extended_state.key_count === 0;
		}
	});
	CAPSLOCKED._fsm_add_transition({ event_id: 'any_key', type: 'internal',
		action: function({ args, extended_state }) {
			--extended_state.key_count;
			// console.log( 'emit code: '+ args.code +', upper-case: ' + String.fromCharCode( args.code ).toUpperCase() );
		}
	});

	DEFAULT._fsm_add_transition({ event_id: 'stop', target: STOPPED });
	CAPSLOCKED._fsm_add_transition({ event_id: 'stop', target: STOPPED });

	// export into Graphviz format
	// console.log( FSM.export_as_graphviz() );

	entry_exit( FSM );
	entry_exit( DEFAULT );
	entry_exit( CAPSLOCKED );
	entry_exit( STOPPED );

	// start FSM and get default state as string
	await FSM._fsm_start();
	// console.log('FSM started: ' + FSM._fsm_get_active_state_as_string() );
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/DEFAULT', 'INIT' );
	t.test( t.get() === 'EN/KEYBOARD/EN/DEFAULT', 'T0');
	t.clear();

	// emit events
	await FSM._fsm_emit_event({ event_id: 'capslock' });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/CAPSLOCKED' );
	t.test( t.get() === 'EX/DEFAULT/EN/CAPSLOCKED', 'T1');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'any_key', args: { code: ( "a".charCodeAt(0) ) } });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/CAPSLOCKED' );
	t.test( t.get() === '', 'T2');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'capslock' });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/DEFAULT' );
	t.test( t.get() === 'EX/CAPSLOCKED/EN/DEFAULT', 'T3');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'any_key', args: { code: ( "b".charCodeAt(0) ) } });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/DEFAULT' );
	t.test( t.get() === '', 'T4');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'any_key', args: { code: ( "c".charCodeAt(0) ) } });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/DEFAULT' );
	t.test( t.get() === '', 'T5');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'any_key', args: { code: ( "d".charCodeAt(0) ) } });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/DEFAULT' );
	t.test( t.get() === '', 'T6');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'any_key', args: { code: ( "e".charCodeAt(0) ) } });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/DEFAULT' );
	t.test( t.get() === '', 'T7');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'any_key', args: { code: ( "f".charCodeAt(0) ) } });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/STOPPED' );
	t.test( t.get() === 'EX/DEFAULT/EN/STOPPED', 'T8');
	t.clear();

    return t.results();
};

function entry_exit( state ) {
    state._fsm_entry_callback = async ({ args, extended_state }) => {
		t.add( 'EN/' + state._fsm_id );
        // console.log( 'enter state: ' + state.id, args, extended_state );
    };
    state._fsm_exit_callback = async ({ args, extended_state }) => {
		t.add( 'EX/' + state._fsm_id );
        // console.log( '...exit state: ' + state.id, args, extended_state );
    };
};
