import { UmlFsm } from '../umlfsm';

import Test from './test.js';
let t = new Test('deferred');

export default async function umlfsm_test_deferred() {
	// console.log('--- UmlFsm test --- deferred ---');

	// main state machine
	let FSM = new UmlFsm({ id: 'FSM' });

	// setup states
	let STATE1 = FSM._fsm_create_child_state({ id: 'STATE1', defer: [ 'event1' ] }),
		STATE2 = FSM._fsm_create_child_state({ id: 'STATE2', defer: [ 'event1' ] }),
		STATE3 = FSM._fsm_create_child_state({ id: 'STATE3' }),
		STATE4 = FSM._fsm_create_child_state({ id: 'STATE4' }),
		STATE5 = FSM._fsm_create_child_state({ id: 'STATE5' }),
		STATE6 = FSM._fsm_create_child_state({ id: 'STATE6' });

	// setup transitions
	STATE1._fsm_add_transition({ event_id: 'event2', target: STATE2 });
	STATE2._fsm_add_transition({ event_id: 'event2', target: STATE3 });
	STATE3._fsm_add_transition({ event_id: 'event1', target: STATE4 });
	STATE4._fsm_add_transition({ event_id: 'event1', target: STATE5 });
	STATE5._fsm_add_transition({ event_id: 'event2', target: STATE6 });

	// export into Graphviz format
	// console.log( FSM.export_as_graphviz() );

	entry_exit( FSM );
	entry_exit( STATE1 );
	entry_exit( STATE2 );
	entry_exit( STATE3 );
	entry_exit( STATE4 );
	entry_exit( STATE5 );
	entry_exit( STATE6 );

	// start FSM and get default state as string
	await FSM._fsm_start();
	// console.log('FSM started: ' + FSM._fsm_get_active_state_as_string() );
	t.test( FSM._fsm_get_active_state_as_string() === 'FSM/STATE1', 'INIT' );
	t.test( t.get() === 'EN/FSM/EN/STATE1', 'T0');
	t.clear();

	// emit events

	await FSM._fsm_emit_event({ event_id: 'event1' });
	t.test( FSM._fsm_get_active_state_as_string() === 'FSM/STATE1' );
	t.test( t.get() === '', 'T1');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'event1' });
	t.test( FSM._fsm_get_active_state_as_string() === 'FSM/STATE1' );
	t.test( t.get() === '', 'T2');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'event2' });
	t.test( FSM._fsm_get_active_state_as_string() === 'FSM/STATE2' );
	t.test( t.get() === 'EX/STATE1/EN/STATE2', 'T3');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'event2' });
	t.test( FSM._fsm_get_active_state_as_string() === 'FSM/STATE5' );
	t.test( t.get() === 'EX/STATE2/EN/STATE3/EX/STATE3/EN/STATE4/EX/STATE4/EN/STATE5', 'T4');
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'event2' });
	t.test( FSM._fsm_get_active_state_as_string() === 'FSM/STATE6' );
	t.test( t.get() === 'EX/STATE5/EN/STATE6', 'T4');
	t.clear();

	// final state should be STATE5, not STATE3 because of re-queuing of deferred events
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
