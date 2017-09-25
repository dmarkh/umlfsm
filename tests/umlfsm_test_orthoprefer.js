import { UmlFsm } from '../umlfsm';

import Test from './test.js';
let t = new Test('orthoprefer');

export default async function umlfsm_test_orthoprefer() {
	// console.log('--- UmlFsm test --- orthoprefer ---');

	// main state machine
	let FSM = new UmlFsm({ id: 'TEST' });

	// setup states
	let state1 = FSM._fsm_create_child_state({ id: 'state1' }),
		state2 = FSM._fsm_create_child_state({ id: 'state2' }),
			state21 = state2._fsm_create_child_state({ id: 'state21' }),
			state22 = state2._fsm_create_child_state({ id: 'state22', parallel: true }),
				state221 = state22._fsm_create_child_state({ id: 'state221' }),
					state2211 = state221._fsm_create_child_state({ id: 'state2211' }),
					state2212 = state221._fsm_create_child_state({ id: 'state2212' }),
				state222 = state22._fsm_create_child_state({ id: 'state222' }),
					state2221 = state222._fsm_create_child_state({ id: 'state2221' }),
					state2222 = state222._fsm_create_child_state({ id: 'state2222' }),
		state3 = FSM._fsm_create_child_state({ id: 'state3' });

	// setup transitions

	// regular transition to parallel, default path used
	state1._fsm_add_transition({ event_id: 'trans1', target: state2 });

	// regular out of parallel = merge pseudo state
	state2._fsm_add_transition({ event_id: 'trans2', target: state3 });

	// guided transition via preferred states
	state3._fsm_add_transition({ event_id: 'trans3', target: state2, prefer: [ state2212, state2222 ] });

	// regular transition
	state3._fsm_add_transition({ event_id: 'trans4', target: state1 });

	// export into Graphviz format
	// console.log( FSM.export_as_graphviz() );

	entry_exit( FSM );
	entry_exit( state1 );
	entry_exit( state2 );
		entry_exit( state21 );
		entry_exit( state22 );
			entry_exit( state221 );
				entry_exit( state2211 );
				entry_exit( state2212 );
			entry_exit( state222 );
				entry_exit( state2221 );
				entry_exit( state2222 );
	entry_exit( state3 );

	// start FSM and get default state as string
	await FSM._fsm_start();
	// console.log('FSM started: ' + FSM._fsm_get_active_state_as_string() );
	t.test( FSM._fsm_get_active_state_as_string() === 'TEST/state1', 'INIT' );
	t.test( t.get() === 'EN/TEST/EN/state1', 'T0');
	t.clear();

	// emit events
	await FSM._fsm_emit_event({ event_id: 'trans1' }); // regular
	t.test( FSM._fsm_get_active_state_as_string() === 'TEST/state2/state21' );
	t.test( t.get() === 'EX/state1/EN/state2/EN/state21', 'T1');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'trans2' }); // regular
	t.test( FSM._fsm_get_active_state_as_string() === 'TEST/state3' );
	t.test( t.get() === 'EX/state21/EX/state2/EN/state3', 'T2');
	t.clear();

console.time('complex transition - enter');
	await FSM._fsm_emit_event({ event_id: 'trans3' }); // preferred
console.timeEnd('complex transition - enter');
	t.test( FSM._fsm_get_active_state_as_string() === 'TEST/state2/state22/(state221/state2212|state222/state2222)' );
	t.test( t.get() === 'EX/state3/EN/state2/EN/state22/EN/state221/EN/state222/EN/state2212/EN/state2222', 'T3');
	t.clear();

console.time('complex transition - exit');
	await FSM._fsm_emit_event({ event_id: 'trans2' }); // regular
console.timeEnd('complex transition - exit');
	t.test( FSM._fsm_get_active_state_as_string() === 'TEST/state3' );
	t.test( t.get() === 'EX/state2212/EX/state2222/EX/state221/EX/state222/EX/state22/EX/state2/EN/state3', 'T4');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'trans4' }); // regular
	t.test( FSM._fsm_get_active_state_as_string() === 'TEST/state1' );
	t.test( t.get() === 'EX/state3/EN/state1', 'T5');
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
