
# UmlFsm - UML-compliant State Machine for Javascript ES6+

## Intro

UmlFsm is the event-driven, hierarchical finite state machine, which
implements core features of the [UML State Machine](https://en.wikipedia.org/wiki/UML_state_machine):

 * hierarchical nested states and orthogonal regions
 * external, internal, and local transitions between states
 * entry / exit / action callbacks
 * extended states, guard conditions
 * run-to-completion execution model: event queue, deferred event queue

In addition, it features:

 * transitions guided by state history
 * transitions guided by multiple target states
 * async / await for all actions
 * rudimentary export of the FSM to graphviz format

Implementation details:

 * Written using JavaScript ES6+, (is async/await ES8?)
 * Tested to work well with older browsers if transpiled by Babel
 * Checked with ESLint - ES8 preset
 * Custom tests cover many transition scenarios and combinations

## How-To

### Installation

UmlFsm could be installed via NPM:
        
        $> npm install umlfsm
        
Or, it could be used as directly by including the umlfsm.js file with your project


### Basic usage

        
        import { UmlFsm } from 'umlfsm';
        
        // initialize simple FSM and three states
        let FSM = new UmlFsm({ id: "FSM" }),
            A = FSM._fsm_create_child_state({ id: "A" }),
            B = FSM._fsm_create_child_state({ id: "B" }),
            C = FSM._fsm_create_child_state({ id: "C" });
        
        // add transitions
        A._fsm_add_transition({ event_id: 'change', target: B });
        B._fsm_add_transition({ event_id: 'change', target: C,
        	action: function({ args, extended_state }) {
                console.log('event parameters object', args);
        	    console.log('extended state object', extended_state);
            }
        });
        
        C._fsm_add_transition({ event_id: 'goback', target: A });
        
        // add entry/exit callbacks
        B._fsm_entry_callback = async ({ args, extended_state }) => {
            console.log('entered state B');
        };
        B._fsm_exit_callback = async ({ args, extended_state }) => {
            console.log('exited state B');
        };
        
        // auto-transit to the initial state A
        FSM._fsm_start();
        
        // emit events
        // transition A->B
        FSM._fsm_emit_event({ event_id: 'change' });
        // transition B->C
        FSM._fsm_emit_event({ event_id: 'change' });
        // transition C->A
        FSM._fsm_emit_event({ event_id: 'goback' });
        

## FSM initialization

UML Finite State Machine is initialized as follows:
        
        import { UmlFsm, UmlFsmState } from 'umlfsm';
        
        let FSM = new UmlFsm({ id: "FSM", extended_state: { counter: 1000 } });
        

States could be added to the FSM in two ways: direct or indirect

        
        // Example: nested parallel state A containing simultaneously operated states B and C
        let A = FSM._fsm_create_child_state({ id: 'A', parallel: true }),
        	B = state1._fsm_create_child_state({ id: 'B' }),
        	C = state1._fsm_create_child_state({ id: 'C', defer: ['evt1','evt2'] });
        

...alternatively, if you decide to use subclassing of states...

        
        // parallel state
        // create independent states first
        let A = new UmlFsmState({ id: 'A', parallel: true }),
            B = new UmlFsmState({ id: 'B' });
            C = new UmlFsmState({ id: 'C' });
        
        // then adopt states ( or your subclasses ) by another state ( or subclass of state )
        FSM._fsm_adopt_child_state( A );
        state1._fsm_adopt_child_state( B );
        state1._fsm_adopt_child_state( C );
        

## Transitions

UmlFsm supports three types of transitions: external, local, internal. External transition causes "exit" of all states up to 
the Least Common Ancestor (LCA), then calls "entry" handler of all states down to target 
( or beyond that if target is a nested/parallel state ).

Transitions could be set up as follows:
        
### classic external transition from state A to state B
For external transitions, _type_ parameter could be omitted.
        
        A._fsm_add_transition({ event_id: 'A-B', target: B, type: 'external' });
        
...or...

### local transition from state A to state B
assuming B is a sub-state of A, it will not perform exit from A
        
        A._fsm_add_transition({ event_id: 'A-B', target: B, type: 'local' });

...or...

### no-target internal transition with the attached action
Does not trigger exit/entry callbacks, just fires action if provided
        
        B._fsm_add_transition({ event_id: 'B-B', type: 'internal',
          action: function({ args, extended_state }) {
            if ( args.item === 3 ) {
              --extended_state.counter;
            }
          }
        });

...or...
        
### transition via saved history state
B = previously accessed nested state. See classic "washer machine being turned off and then on" example for a use-case
        
        A._fsm_add_transition({ event_id: 'change', target: B, history: true });
        
...or...
        
### guarded transition using extended state
        B._fsm_add_transition({ event_id: 'B-C',
          guard: function({ args, extended_state }) {
            return extended_state.counter > 500;
          }
        });
        
...or...

### guided external transition to a parallel state
Transition, guided by a set of desired final states. Sometimes, it is required to enter a parallel state in non-default fashion.
Imagine parallel state C with [ D0,D1,D2 ] | [ E0,E1,E2 ] states where D0 and E0 are default entry points, while you need to enter C at D2,E1 and not at D0,E0:
        
        B._fsm_add_transition({ event_id: 'B-C', target: C, prefer: [ D2, E1 ] });
        
... or use combination of all above...

## Entry / Exit Callbacks

States may have an entry / exit callbacks attached. Callbacks have full access to the event parameters (args) and extended state:
        
        B._fsm_entry_callback = async ({ args, extended_state }) => {
          console.log('entered state B');
        };
        B._fsm_exit_callback = async ({ args, extended_state }) => {
          console.log('exited state B');
        };

## Emit events
Here is how events can be emitted, along with event parameters (args):
        
        FSM._fsm_emit_event({ event_id: 'num_key', args: { code: ( "a".charCodeAt(0) ) } });
        

## Guard Conditions
Guard Condition is a function which is specified for a transition and forbids the transition if evaluated to false.
It can use event parameters or extended state to decide on the outcome.
        
        B._fsm_add_transition({ event_id: 'B-C',
          guard: function({ args, extended_state }) {
            return extended_state.counter > 500;
          }
        });
        
## Pseudo-states

* Initial state = upon start, FSM will automatically use local transition from the hypotetical initial state to the starting state.
* Choice = define multiple (guarded) transitions with the same name from state A to states [B,C...Z]. First allowed transition will be executed, so if (..) {} else if (...) {} else {} scenarios could be implemented.
* Fork = use regular transition into parallel state (default path), or define guided transition into parallel state indicating preferred final states via _prefer_ flag of the transition.
* Join = define transition from parent state (parallel) to the target. Multiple nested child states will be exited to enter a single target state.
* Deep History = use transition with _history_ flag set to _true_ to indicate that last used state is preferred over default path upon enter.

## Utilities

### Stringify FSM state
Sometimes it is useful to export current FSM state (tree, in case of nested states) as a string, e.g. for debug purposes:
          
          ...
          // start FMS in synchronous mode, let it transition
          await FSM.start();
          
          // dump initial active state
	      let state_as_string = FSM._fsm_get_active_state_as_string();
          ...

### GraphViz Dot export
UmlFsm introduces rudimentary support for graphviz export. Not guaranteed to produce precise results (or even work) for all FSMs.
        
	      let dot = FSM._fsm_export_as_graphviz();
	      // ...save result as test.dot, run graph processor...

	      $> dot test.dot -Tpng -o test.png
	      // note: self-transition of a nested state is not supported yet
      
## License

UmlFsm is covered under the terms of [MIT License](https://en.wikipedia.org/wiki/MIT_License)
