import { UmlFsm } from '../umlfsm';

import Test from './test.js';
let t = new Test('orthogonal');

export default async function umlfsm_test_orthogonal() {
	// console.log('--- UmlFsm test --- orthogonal ---');

	// main state machine
	let FSM = new UmlFsm({ id: 'KEYBOARD', parallel: true });

	// setup states
	let MAIN_KEYPAD    = FSM._fsm_create_child_state({ id: 'main_keypad' }),
		NUMERIC_KEYPAD = FSM._fsm_create_child_state({ id: 'numeric_keypad' });

	let DEFAULT = MAIN_KEYPAD._fsm_create_child_state({ id: 'default' }),
		CAPSLOCKED = MAIN_KEYPAD._fsm_create_child_state({ id: 'capslocked' });

	let NUMBERS = NUMERIC_KEYPAD._fsm_create_child_state({ id: 'numbers' }),
		ARROWS  = NUMERIC_KEYPAD._fsm_create_child_state({ id: 'arrows' });

	// setup transitions
	DEFAULT._fsm_add_transition({ event_id: 'capslock', target: CAPSLOCKED });
	CAPSLOCKED._fsm_add_transition({ event_id: 'capslock', target: DEFAULT });
	DEFAULT._fsm_add_transition({ event_id: 'any_key', type: 'internal',
		action: function({ args, extended_state }) {
			// console.log( 'default: any_key, emit code: '+ args.code +', lower-case: ' + String.fromCharCode( args.code ).toLowerCase() );
		}
	});
	CAPSLOCKED._fsm_add_transition({ event_id: 'any_key', type: 'internal',
		action: function({ args, extended_state }) {
			// console.log( 'capsloked: any_key, emit code: '+ args.code +', upper-case: ' + String.fromCharCode( args.code ).toUpperCase() );
		}
	});

	NUMBERS._fsm_add_transition({ event_id: 'numlock', target: ARROWS });
	ARROWS._fsm_add_transition({ event_id: 'numlock', target: NUMBERS });
	NUMBERS._fsm_add_transition({ event_id: 'num_key', type: 'internal',
		action: function({ args, extended_state }) {
			// console.log( 'numbers: num_key', args, extended_state );
		}
	});
	ARROWS._fsm_add_transition({ event_id: 'num_key', type: 'internal',
		action: function({ args, extended_state }) {
			// console.log( 'arrows: num_key', args, extended_state );
		}
	});

	FSM._fsm_add_transition({ event_id: 'reinit', target: FSM });

	// export into Graphviz format
	// console.log( FSM.export_as_graphviz() );

	entry_exit( FSM );
	entry_exit( MAIN_KEYPAD );
	entry_exit( NUMERIC_KEYPAD );
	entry_exit( DEFAULT );
	entry_exit( CAPSLOCKED );
	entry_exit( NUMBERS );
	entry_exit( ARROWS );

	// start FSM and get default state as string
	await FSM._fsm_start();
	//console.log('FSM started: ' + FSM._fsm_get_active_state_as_string() );
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/(main_keypad/default|numeric_keypad/numbers)', 'INIT' );
	t.test( t.get() === 'EN/KEYBOARD/EN/main_keypad/EN/numeric_keypad/EN/default/EN/numbers', 'T0' );
	t.clear();

	// emit events
	await FSM._fsm_emit_event({ event_id: 'capslock' });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/(main_keypad/capslocked|numeric_keypad/numbers)' );
	t.test( t.get() === 'EX/default/EN/capslocked', 'T1' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'any_key', args: { code: ( "a".charCodeAt(0) ) } });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/(main_keypad/capslocked|numeric_keypad/numbers)' );
	t.test( t.get() === '', 'T2' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'capslock' });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/(main_keypad/default|numeric_keypad/numbers)' );
	t.test( t.get() === 'EX/capslocked/EN/default', 'T3' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'any_key', args: { code: ( "a".charCodeAt(0) ) } });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/(main_keypad/default|numeric_keypad/numbers)' );
	t.test( t.get() === '', 'T4' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'numlock' });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/(main_keypad/default|numeric_keypad/arrows)' );
	t.test( t.get() === 'EX/numbers/EN/arrows', 'T5' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'num_key', args: { code: ( "a".charCodeAt(0) ) } });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/(main_keypad/default|numeric_keypad/arrows)' );
	t.test( t.get() === '', 'T6' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'numlock' });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/(main_keypad/default|numeric_keypad/numbers)' );
	t.test( t.get() === 'EX/arrows/EN/numbers', 'T7' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'num_key', args: { code: ( "a".charCodeAt(0) ) } });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/(main_keypad/default|numeric_keypad/numbers)' );
	t.test( t.get() === '', 'T8' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'reinit' });
	t.test( FSM._fsm_get_active_state_as_string() === 'KEYBOARD/(main_keypad/default|numeric_keypad/numbers)' );
	t.test( t.get() === 'EX/default/EX/numbers/EX/main_keypad/EX/numeric_keypad/EN/main_keypad/EN/numeric_keypad/EN/default/EN/numbers', 'T9' );
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
