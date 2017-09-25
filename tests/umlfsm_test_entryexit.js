import { UmlFsm } from '../umlfsm';

import Test from './test.js';
let t = new Test('entry/exit');

export default async function umlfsm_test_entryexit() {
	// console.log('--- UmlFsm test --- entry/exit ---');

	// main state machine
	let FSM = new UmlFsm({ id: 'TOASTEROVEN' });

	// setup states
	let HEATING = FSM._fsm_create_child_state({ id: 'heating' }),
		DOOROPEN = FSM._fsm_create_child_state({ id: 'door_open' });

	let TOASTING = HEATING._fsm_create_child_state({ id: 'toasting' }),
		BAKING = HEATING._fsm_create_child_state({ id: 'baking' });

	// setup transitions
	HEATING._fsm_add_transition({ event_id: 'door_open', target: DOOROPEN });
	DOOROPEN._fsm_add_transition({ event_id: 'door_close', target: HEATING });

	HEATING._fsm_add_transition({ event_id: 'do_toasting', target: TOASTING, type: 'local' });
	HEATING._fsm_add_transition({ event_id: 'do_baking', target: BAKING, type: 'local' });
	HEATING._fsm_add_transition({ event_id: 'do_baking_ext', target: BAKING, type: 'external' });

	// export into Graphviz format
	// console.log( FSM.export_as_graphviz() );

	entry_exit( FSM );
	entry_exit( HEATING );
	entry_exit( DOOROPEN );
	entry_exit( TOASTING );
	entry_exit( BAKING );

	// start FSM and get default state as string
	await FSM._fsm_start();
	// console.log('FSM started: ' + FSM._fsm_get_active_state_as_string() );
	t.test( FSM._fsm_get_active_state_as_string() === 'TOASTEROVEN/heating/toasting', 'INIT' );
	t.test( t.get() === 'EN/TOASTEROVEN/EN/heating/EN/toasting', 'T0' );
	t.clear();

	// emit events
	await FSM._fsm_emit_event({ event_id: 'do_baking' });
	t.test( FSM._fsm_get_active_state_as_string() === 'TOASTEROVEN/heating/baking' );
	t.test( t.get() === 'EX/toasting/EN/baking', 'T1' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'do_toasting' });
	t.test( FSM._fsm_get_active_state_as_string() === 'TOASTEROVEN/heating/toasting' );
	t.test( t.get() === 'EX/baking/EN/toasting', 'T2' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'do_baking_ext' });
	t.test( FSM._fsm_get_active_state_as_string() === 'TOASTEROVEN/heating/baking' );
	t.test( t.get() === 'EX/toasting/EX/heating/EN/heating/EN/baking', 'T3' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'door_open' });
	t.test( FSM._fsm_get_active_state_as_string() === 'TOASTEROVEN/door_open' );
	t.test( t.get() === 'EX/baking/EX/heating/EN/door_open', 'T4' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'door_close' });
	t.test( FSM._fsm_get_active_state_as_string() === 'TOASTEROVEN/heating/toasting' );
	t.test( t.get() === 'EX/door_open/EN/heating/EN/toasting', 'T5' );
	t.clear();

	await FSM._fsm_emit_event({ event_id: 'do_baking' });
	t.test( FSM._fsm_get_active_state_as_string() === 'TOASTEROVEN/heating/baking' );
	t.test( t.get() === 'EX/toasting/EN/baking', 'T6' );
	t.clear();

    return t.results();
};

function entry_exit( state ) {
    state._fsm_entry_callback = function({ args, extended_state }) {
		t.add( 'EN/' + state._fsm_id );
        // console.log( 'enter state: ' + state.id, args, extended_state );
    };
    state._fsm_exit_callback = function({ args, extended_state }) {
		t.add( 'EX/' + state._fsm_id );
        // console.log( '...exit state: ' + state.id, args, extended_state );
    };
};
