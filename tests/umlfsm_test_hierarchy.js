import { UmlFsm } from '../umlfsm';

import Test from './test.js';
let t = new Test('hierarchy');

export default async function umlfsm_test_hierarchy() {
	// console.log('--- UmlFsm test --- hierarchy ---');

	// main state machine
	let FSM = new UmlFsm({ id: 'CALCULATOR' });

	// setup states
	let ON = FSM._fsm_create_child_state({ id: 'ON' }),
		OPERAND1 = ON._fsm_create_child_state({ id: 'OPERAND1' }),
		OPENTERED = ON._fsm_create_child_state({ id: 'OPENTERED' }),
		OPERAND2 = ON._fsm_create_child_state({ id: 'OPERAND2' }),
		RESULT = ON._fsm_create_child_state({ id: 'RESULT' }),
		STOPPED = FSM._fsm_create_child_state({ id: 'STOPPED' });

	// setup transitions
	OPERAND1._fsm_add_transition({ event_id: 'enter', target: OPENTERED });
	OPENTERED._fsm_add_transition({ event_id: 'enter', target: OPERAND2 });
	OPERAND2._fsm_add_transition({ event_id: 'enter', target: RESULT });
	RESULT._fsm_add_transition({ event_id: 'enter', target: OPERAND1 });

	ON._fsm_add_transition({ event_id: 'c', target: ON });
	ON._fsm_add_transition({ event_id: 'off', target: STOPPED });

	// export into Graphviz format
	// console.log( FSM.export_as_graphviz() );

	entry_exit( FSM );
	entry_exit( ON );
	entry_exit( OPERAND1 );
	entry_exit( OPENTERED );
	entry_exit( OPERAND2 );
	entry_exit( RESULT );
	entry_exit( STOPPED );

	// start FSM and get default state as string
	await FSM._fsm_start();
	// console.log('FSM started: ' + FSM._fsm_get_active_state_as_string() );
	t.test( FSM._fsm_get_active_state_as_string() === 'CALCULATOR/ON/OPERAND1', 'INIT' );
	t.test( t.get() === 'EN/CALCULATOR/EN/ON/EN/OPERAND1', 'T0' );
	t.clear();

	// emit events
	await FSM._fsm_emit_event({ event_id: 'enter' }); // transit to OPENTERED
	t.test( FSM._fsm_get_active_state_as_string() === 'CALCULATOR/ON/OPENTERED' );
	t.test( t.get() === 'EX/OPERAND1/EN/OPENTERED', 'T1' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'enter' }); // transit to OPERAND2
	t.test( FSM._fsm_get_active_state_as_string() === 'CALCULATOR/ON/OPERAND2' );
	t.test( t.get() === 'EX/OPENTERED/EN/OPERAND2', 'T2' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'enter' }); // transit to RESULT
	t.test( FSM._fsm_get_active_state_as_string() === 'CALCULATOR/ON/RESULT' );
	t.test( t.get() === 'EX/OPERAND2/EN/RESULT', 'T3' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'c' }); // transit to OPERAND1
	t.test( FSM._fsm_get_active_state_as_string() === 'CALCULATOR/ON/OPERAND1' );
	t.test( t.get() === 'EX/RESULT/EX/ON/EN/ON/EN/OPERAND1', 'T4' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'off' }); // transit to STOPPED
	t.test( FSM._fsm_get_active_state_as_string() === 'CALCULATOR/STOPPED' );
	t.test( t.get() === 'EX/OPERAND1/EX/ON/EN/STOPPED', 'T5' );
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
