
import umlfsm_test_basic from './umlfsm_test_basic';
import umlfsm_test_deferred from './umlfsm_test_deferred';
import umlfsm_test_entryexit from './umlfsm_test_entryexit';
import umlfsm_test_extendedstate from './umlfsm_test_extendedstate';
import umlfsm_test_hierarchy from './umlfsm_test_hierarchy';
import umlfsm_test_history from './umlfsm_test_history';
import umlfsm_test_orthogonal from './umlfsm_test_orthogonal';
import umlfsm_test_brakes from './umlfsm_test_brakes';
import umlfsm_test_orthoprefer from './umlfsm_test_orthoprefer';

async function run_tests() {

	let tests = [];
	tests.push( await umlfsm_test_basic() );
	tests.push( await umlfsm_test_brakes() );
	tests.push( await umlfsm_test_deferred() );
	tests.push( await umlfsm_test_entryexit() );
	tests.push( await umlfsm_test_extendedstate() );
	tests.push( await umlfsm_test_hierarchy() );
	tests.push( await umlfsm_test_history() );
	tests.push( await umlfsm_test_orthogonal() );
	tests.push( await umlfsm_test_orthoprefer() );

	console.log('-------------------------------------------------');

	for( let test of tests ) {
		console.log( test );
	}

	console.log('-------------------------------------------------');
}

run_tests();
