import { UmlFsm } from '../umlfsm';

import Test from './test.js';
let t = new Test('basic');

export default async function umlfsm_test_basic() {
	// console.log('--- UmlFsm test --- basic ---');

	// main state machine
	let KEYBOARD = new UmlFsm({ id: 'KEYBOARD', debug: console.log });

	// setup states
	let DEFAULT = KEYBOARD._fsm_create_child_state({ id: 'DEFAULT' }),
		CAPSLOCKED = KEYBOARD._fsm_create_child_state({ id: 'CAPSLOCKED' });

	// setup transitions
	DEFAULT._fsm_add_transition({ event_id: 'capslock', target: CAPSLOCKED });
	CAPSLOCKED._fsm_add_transition({ event_id: 'capslock', target: DEFAULT });
	DEFAULT._fsm_add_transition({ event_id: 'any_key', type: 'internal',
		action: ({ args, extended_state }) => {
			// console.log( 'emit code: '+ args.code +', lower-case: ' + String.fromCharCode( args.code ).toLowerCase() );
		}
	});
	CAPSLOCKED._fsm_add_transition({ event_id: 'any_key', type: 'internal',
		action: ({ args, extended_state }) => {
			// console.log( 'emit code: '+ args.code +', upper-case: ' + String.fromCharCode( args.code ).toUpperCase() );
		}
	});

	// export into Graphviz format
	// console.log( KEYBOARD.export_as_graphviz() );

	entry_exit( KEYBOARD );
	entry_exit( DEFAULT );
	entry_exit( CAPSLOCKED );

	// start FSM and get default state as string
	await KEYBOARD._fsm_start();
	// console.log('FSM started: ' + KEYBOARD._fsm_get_active_state_as_string() );
	t.test( KEYBOARD._fsm_get_active_state_as_string() === 'KEYBOARD/DEFAULT', 'INIT' );
	t.test( t.get() === 'EN/KEYBOARD/EN/DEFAULT', 'T0' );
	t.clear();

	// emit events
console.time('basic transition - warmup?');
	await KEYBOARD._fsm_emit_event({ event_id: 'capslock' });
console.timeEnd('basic transition - warmup?');
	t.test( KEYBOARD._fsm_get_active_state_as_string() === 'KEYBOARD/CAPSLOCKED' );
	t.test( t.get() === 'EX/DEFAULT/EN/CAPSLOCKED', 'T1' );
	t.clear();

	await KEYBOARD._fsm_emit_event({ event_id: 'any_key', args: { code: ( "a".charCodeAt(0) ) } });
	t.test( KEYBOARD._fsm_get_active_state_as_string() === 'KEYBOARD/CAPSLOCKED' );
	t.test( t.get() === '', 'T2' );
	t.clear();

console.time('basic transition');
	await KEYBOARD._fsm_emit_event({ event_id: 'capslock' });
console.timeEnd('basic transition');
	t.test( KEYBOARD._fsm_get_active_state_as_string() === 'KEYBOARD/DEFAULT' );
	t.test( t.get() === 'EX/CAPSLOCKED/EN/DEFAULT', 'T3' );
	t.clear();

	await KEYBOARD._fsm_emit_event({ event_id: 'any_key', args: { code: ( "a".charCodeAt(0) ) } });
	t.test( KEYBOARD._fsm_get_active_state_as_string() === 'KEYBOARD/DEFAULT' );
	t.test( t.get() === '', 'T4' );
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
