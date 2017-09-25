import { UmlFsm } from '../umlfsm';

import Test from './test.js';
let t = new Test('brakes');

export default async function umlfsm_test_brakes() {
	//console.log('--- UmlFsm test --- brakes ---');

	// main state machine
	let FSM = new UmlFsm({ id: 'CAR', debug: false });

	// setup states
	let state_in = FSM._fsm_create_child_state({ id: 'state_in' }),
		brakes = FSM._fsm_create_child_state({ id: 'brakes', parallel: true }),
			front = brakes._fsm_create_child_state({ id: 'front' }),
			  front_depressed = front._fsm_create_child_state({ id: 'front_depressed' }),
			    front_pressed = front._fsm_create_child_state({ id: 'front_pressed' }),
			rear = brakes._fsm_create_child_state({ id: 'rear' }),
			  rear_depressed = rear._fsm_create_child_state({ id: 'rear_depressed' }),
				rear_pressed = rear._fsm_create_child_state({ id: 'rear_pressed' }),
		state_out = FSM._fsm_create_child_state({ id: 'state_out' });

	// setup transitions

	state_in._fsm_add_transition({ event_id: 'enter_brakes', target: brakes });
	brakes._fsm_add_transition({ event_id: 'exit_brakes', target: state_out });

	// setup simultaneously executed events for each brake state:
	front_depressed._fsm_add_transition({ event_id: 'press_brakes', target: front_pressed });
	 rear_depressed._fsm_add_transition({ event_id: 'press_brakes', target: rear_pressed });
	front_pressed._fsm_add_transition({ event_id: 'depress_brakes', target: front_depressed });
	 rear_pressed._fsm_add_transition({ event_id: 'depress_brakes', target: rear_depressed });

/*
	// alternatively, set up global press/depress event for each pair of brakes using local transition:
	front._fsm_add_transition({ event_id: 'press_brakes', target: front_pressed, type: 'local' });
	 rear._fsm_add_transition({ event_id: 'press_brakes', target: rear_pressed, type: 'local' });
	front._fsm_add_transition({ event_id: 'depress_brakes', target: front_depressed, type: 'local' });
	 rear._fsm_add_transition({ event_id: 'depress_brakes', target: rear_depressed, type: 'local' });
*/

	// export into Graphviz format
	// console.log( FSM.export_as_graphviz() );

	entry_exit( FSM );
	entry_exit( state_in );
	entry_exit( brakes );
		entry_exit( front );
			entry_exit( front_pressed );
			entry_exit( front_depressed );
		entry_exit( rear );
			entry_exit( rear_pressed );
			entry_exit( rear_depressed );
	entry_exit( state_out );

	// start FSM and get default state as string
	await FSM._fsm_start();
	// console.log('FSM started: ' + FSM._fsm_get_active_state_as_string() );
	t.test( FSM._fsm_get_active_state_as_string() === 'CAR/state_in', 'INIT' );
	t.test( t.get() === 'EN/CAR/EN/state_in', 'T0' );
	t.clear();

	// emit events
	await FSM._fsm_emit_event({ event_id: 'enter_brakes' });
	t.test( FSM._fsm_get_active_state_as_string() === 'CAR/brakes/(front/front_depressed|rear/rear_depressed)' );
	t.test( t.get() === 'EX/state_in/EN/brakes/EN/front/EN/rear/EN/front_depressed/EN/rear_depressed', 'T1' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'press_brakes' });
	t.test( FSM._fsm_get_active_state_as_string() === 'CAR/brakes/(front/front_pressed|rear/rear_pressed)' );
	t.test( t.get() === 'EX/front_depressed/EN/front_pressed/EX/rear_depressed/EN/rear_pressed', 'T2' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'depress_brakes' });
	t.test( FSM._fsm_get_active_state_as_string() === 'CAR/brakes/(front/front_depressed|rear/rear_depressed)' );
	t.test( t.get() === 'EX/front_pressed/EN/front_depressed/EX/rear_pressed/EN/rear_depressed', 'T3' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'exit_brakes' });
	t.test( FSM._fsm_get_active_state_as_string() === 'CAR/state_out' );
	t.test( t.get() === 'EX/front_depressed/EX/rear_depressed/EX/front/EX/rear/EX/brakes/EN/state_out', 'T4' );
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
