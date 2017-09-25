import { UmlFsm, UmlFsmState } from '../umlfsm';

import Test from './test.js';
let t = new Test('history');

export default async function umlfsm_test_history() {
	// console.log('--- UmlFsm test --- history ---');

	// main state machine
	let FSM = new UmlFsm({ id: 'WASHERMACHINE' });

	let RUNNING = new UmlFsmState({ id: 'RUNNING' }),
		WASHING = new UmlFsmState({ id: 'WASHING' }),
		RINSING = new UmlFsmState({ id: 'RINSING' }),
		SPINNING = new UmlFsmState({ id: 'SPINNING' }),
		POWEROFF = new UmlFsmState({ id: 'POWEROFF' }),
		FINISHED = new UmlFsmState({ id: 'FINISHED' });

	FSM._fsm_adopt_child_state( RUNNING );
	FSM._fsm_adopt_child_state( POWEROFF );
	FSM._fsm_adopt_child_state( FINISHED );
	RUNNING._fsm_adopt_child_state( WASHING );
	RUNNING._fsm_adopt_child_state( RINSING );
	RUNNING._fsm_adopt_child_state( SPINNING );

	// setup transitions
	WASHING._fsm_add_transition({ event_id: 'COMPLETE', target: RINSING });
	RINSING._fsm_add_transition({ event_id: 'COMPLETE', target: SPINNING });
	SPINNING._fsm_add_transition({ event_id: 'COMPLETE', target: FINISHED });
	RUNNING._fsm_add_transition({ event_id: 'POWEROFF', target: POWEROFF });
	POWEROFF._fsm_add_transition({ event_id: 'POWERON', target: RUNNING, history: true });

	// export into GraphViz format
	// console.log( FSM.export_as_graphviz() );

	entry_exit( FSM );
	entry_exit( RUNNING );
	entry_exit( WASHING );
	entry_exit( RINSING );
	entry_exit( SPINNING );
	entry_exit( POWEROFF );
	entry_exit( FINISHED );

	// start FSM
	await FSM._fsm_start();
	// console.log('FSM started: ' + FSM._fsm_get_active_state_as_string() );
	t.test( FSM._fsm_get_active_state_as_string() === 'WASHERMACHINE/RUNNING/WASHING', 'INIT' );
	t.test( t.get() === 'EN/WASHERMACHINE/EN/RUNNING/EN/WASHING', 'T0' );
	t.clear();

	// emit events
	await FSM._fsm_emit_event({ event_id: 'COMPLETE' });
	t.test( FSM._fsm_get_active_state_as_string() === 'WASHERMACHINE/RUNNING/RINSING' );
	t.test( t.get() === 'EX/WASHING/EN/RINSING', 'T1' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'COMPLETE' });
	t.test( FSM._fsm_get_active_state_as_string() === 'WASHERMACHINE/RUNNING/SPINNING' );
	t.test( t.get() === 'EX/RINSING/EN/SPINNING', 'T2' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'POWEROFF' });
	t.test( FSM._fsm_get_active_state_as_string() === 'WASHERMACHINE/POWEROFF' );
	t.test( t.get() === 'EX/SPINNING/EX/RUNNING/EN/POWEROFF', 'T3' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'POWERON' });
	t.test( FSM._fsm_get_active_state_as_string() === 'WASHERMACHINE/RUNNING/SPINNING' );
	t.test( t.get() === 'EX/POWEROFF/EN/RUNNING/EN/SPINNING', 'T4' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'COMPLETE' });
	t.test( FSM._fsm_get_active_state_as_string() === 'WASHERMACHINE/FINISHED' );
	t.test( t.get() === 'EX/SPINNING/EX/RUNNING/EN/FINISHED', 'T5' );
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
