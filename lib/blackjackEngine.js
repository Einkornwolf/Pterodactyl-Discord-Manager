/*
 * Copyright (c) 2025 Finn Wolf
 * All rights reserved.
 */

const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, MessageFlags } = require('discord.js')

function createDeck() {
  const suits = ['♠️', '♥️', '♦️', '♣️']
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
  const deck = []
  for (const s of suits) for (const r of ranks) deck.push({suit: s, rank: r})
  return shuffle(deck)
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}

function valueOf(rank) {
  if (rank === 'A') return 11
  if (['J','Q','K'].includes(rank)) return 10
  return parseInt(rank)
}

function handValue(cards) {
  let total = 0
  let aces = 0
  for (const c of cards) {
    const v = valueOf(c.rank)
    total += v
    if (c.rank === 'A') aces++
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return total
}

function computeTotalAndSoft(cards) {
  let total = 0
  let aces = 0
  for (const c of cards) {
    const v = valueOf(c.rank)
    total += v
    if (c.rank === 'A') aces++
  }
  let reductions = 0
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
    reductions++
  }
  const acesCount = cards.filter(c => c.rank === 'A').length
  const acesCountedAs11 = Math.max(0, acesCount - reductions)
  const isSoft = total <= 21 && acesCountedAs11 > 0
  return { total, isSoft }
}

function cardToString(c) {
  return `${c.rank}${c.suit}`
}

function handToString(cards) {
  return cards.map(cardToString).join(' ')
}


function displayHand(cards) {
  const content = cards.map(cardToString).join(' ')
  const total = handValue(cards)
  return "```" + content + "\nTotal: " + total + "```"
}


function displayPartial(card) {
  const content = `${cardToString(card)} ?`
  return "```" + content + "\nTotal: ?```"
}

async function playGame(interaction, { transition = 'update', bet = 0, t } = {}) {
  const deck = createDeck()
  const playerHands = [] // array of hands 
  playerHands.push([deck.pop(), deck.pop()])

  const doubledFlags = [false]
  let dealer = [deck.pop(), deck.pop()]
  const results = { result: null }

  const safe = async (k, def) => {
    try {
      if (!t) return def
      const v = await t(k)
      return typeof v === 'string' && v.length ? v : def
    } catch (e) {
      return def
    }
  }


  if (handValue(dealer) === 21) {
    const outcomes = []
    const naturals = []
    const dealerNatural = true
    for (const hand of playerHands) {
      const pval = handValue(hand)
      const isNatural = (hand.length === 2 && pval === 21)
      naturals.push(isNatural)
      if (isNatural) outcomes.push('PUSH')
      else outcomes.push('LOSE')
    }
    const multipliers = doubledFlags.map(f => f ? 2 : 1)
    try {
      const title = await safe('minigames.blackjack_label', 'Blackjack')
      const finalEmbed = new EmbedBuilder()
        .setTitle(`🎲 ${title} — ${await safe('minigames.result_loss','You lost')}`)
        .setColor(interaction.user && interaction.user.accentColor ? interaction.user.accentColor : 0x2b2d31)
        .setTimestamp()
      for (let idx = 0; idx < playerHands.length; idx++) {
        const h = playerHands[idx]
        const out = outcomes[idx]
        finalEmbed.addFields({ name: `${await safe('minigames.your_hand','Your Hand')} ${playerHands.length>1?`#${idx+1}`:''} — ${out}`, value: `${displayHand(h)}`, inline: false })
      }
      finalEmbed.addFields({ name: await safe('minigames.dealer_shown','Dealer'), value: `${displayHand(dealer)}`, inline: false })
      await interaction.editReply({ embeds: [finalEmbed], components: [] }).catch(()=>{})
    } catch (e) {}
    return Promise.resolve({ result: outcomes.includes('WIN') ? 'WIN' : outcomes.every(o => o === 'PUSH') ? 'PUSH' : 'LOSE', outcomes, dealer: handToString(dealer), multipliers, naturals, dealerNatural })
  }

  const embedFor = async (handIndex) => {
    const hand = playerHands[handIndex]
    const playerTotal = handValue(hand)
  const dealerShown = displayPartial(dealer[0])
   
    const label = await safe("minigames.blackjack_label", 'Blackjack')
      const color = interaction.user && interaction.user.accentColor ? interaction.user.accentColor : 0x2b2d31
      const embed = new EmbedBuilder()
        .setTitle(`🎲 ${label}`)
        .setColor(color)
  .addFields(
  { name: await safe('minigames.your_hand', 'Your Hand'), value: `${displayHand(hand)}`, inline: false },
  { name: await safe('minigames.dealer_shown', 'Dealer'), value: `${dealerShown}`, inline: false }
  )
      .setFooter({ text: `${await safe('minigames.bet_label_short', 'Bet')}: ${bet}` })
        .setTimestamp()
      return embed
  }

  async function buttonsRow(disabled=false, handIndex=0) {
  const safe = async (k, def) => {
    try {
      if (!t) return def
      const v = await t(k)
      return typeof v === 'string' && v.length ? v : def
    } catch (e) {
      return def
    }
  }
  const hitLabel = await safe('minigames.hit', 'Hit')
  const standLabel = await safe('minigames.stand', 'Stand')
  const doubleLabel = await safe('minigames.double', 'Double')
  const splitLabel = await safe('minigames.split', 'Split')
  const cancelLabel = await safe('minigames.cancel', 'Cancel')


  const hand = playerHands[handIndex]

  const canDouble = hand && hand.length === 2 && doubledFlags[handIndex] !== true && [9,10,11].includes(handValue(hand))
 
  const canSplit = hand && hand.length === 2 && hand[0].rank === hand[1].rank && playerHands.length < 4

  const components = []
  components.push(new ButtonBuilder().setCustomId('pdm-bj-hit').setLabel('🟢 ' + hitLabel).setStyle(ButtonStyle.Primary).setDisabled(disabled))
  components.push(new ButtonBuilder().setCustomId('pdm-bj-stand').setLabel('🛑 ' + standLabel).setStyle(ButtonStyle.Danger).setDisabled(disabled))
  if (canDouble) components.push(new ButtonBuilder().setCustomId('pdm-bj-double').setLabel('✳️ ' + doubleLabel).setStyle(ButtonStyle.Primary).setDisabled(disabled))
  if (canSplit) components.push(new ButtonBuilder().setCustomId('pdm-bj-split').setLabel('🔀 ' + splitLabel).setStyle(ButtonStyle.Secondary).setDisabled(disabled))
  components.push(new ButtonBuilder().setCustomId('pdm-bj-cancel').setLabel('❌ ' + cancelLabel).setStyle(ButtonStyle.Secondary).setDisabled(disabled))

  return new ActionRowBuilder().addComponents(...components)
  }


  const finalizeDealer = () => {
    
    while (true) {
      const { total, isSoft } = computeTotalAndSoft(dealer)
      if (total < 17) {
        dealer.push(deck.pop())
        continue
      }
      if (total === 17 && isSoft) {
        dealer.push(deck.pop())
        continue
      }
      break
    }
  }

 
  const initial = await interaction.editReply({ embeds: [await embedFor(0)], components: [await buttonsRow(false, 0)] })

  
  const collector = initial.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 60000 })

  let activeHandIndex = 0
  let doubled = false

  return new Promise((resolve, reject) => {
    collector.on('collect', async (i) => {
      try {
        const id = i.customId
        if (id === 'pdm-bj-hit') {
          playerHands[activeHandIndex].push(deck.pop())
          const val = handValue(playerHands[activeHandIndex])
          if (val > 21) {
    
            try {
              finalizeDealer()
              const outcomesTmp = []
              const naturalsTmp = []
              const dealerNaturalTmp = (dealer && dealer.length === 2 && handValue(dealer) === 21)
              for (const hand of playerHands) {
                const pval = handValue(hand)
                const dval = handValue(dealer)
                const isNatural = (hand.length === 2 && pval === 21)
                naturalsTmp.push(isNatural)
                if (pval > 21) outcomesTmp.push('LOSE')
                else if (dealerNaturalTmp && isNatural) outcomesTmp.push('PUSH')
                else if (isNatural && !dealerNaturalTmp) outcomesTmp.push('WIN')
                else if (dval > 21) outcomesTmp.push('WIN')
                else if (pval > dval) outcomesTmp.push('WIN')
                else if (pval < dval) outcomesTmp.push('LOSE')
                else outcomesTmp.push('PUSH')
              }
              const title = await safe('minigames.blackjack_label', 'Blackjack')
              const finalEmbed = new EmbedBuilder()
                .setTitle(`🎲 ${title} — ${(outcomesTmp.includes('WIN') ? await safe('minigames.result_win','You won') : outcomesTmp.every(o=>o==='PUSH') ? await safe('minigames.result_cancel','Push') : await safe('minigames.result_loss','You lost'))}`)
                .setColor(interaction.user && interaction.user.accentColor ? interaction.user.accentColor : 0x2b2d31)
                .setTimestamp()
              for (let idx = 0; idx < playerHands.length; idx++) {
                const h = playerHands[idx]
                const out = outcomesTmp[idx]
                finalEmbed.addFields({ name: `${await safe('minigames.your_hand','Your Hand')} ${playerHands.length>1?`#${idx+1}`:''} — ${out}`, value: `${displayHand(h)}`, inline: false })
              }
              finalEmbed.addFields({ name: await safe('minigames.dealer_shown','Dealer'), value: `${displayHand(dealer)}`, inline: false })
              await i.update({ embeds: [finalEmbed], components: [] }).catch(()=>{})
            } catch (e) {}
            collector.stop('bust')
            return
          } else {
            await i.update({ embeds: [await embedFor(activeHandIndex)], components: [await buttonsRow(false, activeHandIndex)] })
            return
          }
        }
        if (id === 'pdm-bj-stand') {
    
            if (activeHandIndex < playerHands.length - 1) {
            activeHandIndex++
            await i.update({ embeds: [await embedFor(activeHandIndex)], components: [await buttonsRow(false, activeHandIndex)] })
            return
          } else {
           
            try {
              finalizeDealer()
              const outcomesTmp = []
              const naturalsTmp = []
              const dealerNaturalTmp = (dealer && dealer.length === 2 && handValue(dealer) === 21)
              for (const hand of playerHands) {
                const pval = handValue(hand)
                const dval = handValue(dealer)
                const isNatural = (hand.length === 2 && pval === 21)
                naturalsTmp.push(isNatural)
                if (pval > 21) outcomesTmp.push('LOSE')
                else if (dealerNaturalTmp && isNatural) outcomesTmp.push('PUSH')
                else if (isNatural && !dealerNaturalTmp) outcomesTmp.push('WIN')
                else if (dval > 21) outcomesTmp.push('WIN')
                else if (pval > dval) outcomesTmp.push('WIN')
                else if (pval < dval) outcomesTmp.push('LOSE')
                else outcomesTmp.push('PUSH')
              }

            
              const safe = async (k, def) => {
                try {
                  if (!t) return def
                  const v = await t(k)
                  return typeof v === 'string' && v.length ? v : def
                } catch (e) {
                  return def
                }
              }
              const title = await safe('minigames.blackjack_label', 'Blackjack')
              const finalEmbed = new EmbedBuilder()
                .setTitle(`🎲 ${title} — ${(outcomesTmp.includes('WIN') ? await safe('minigames.result_win','You won') : outcomesTmp.every(o=>o==='PUSH') ? await safe('minigames.result_cancel','Push') : await safe('minigames.result_loss','You lost'))}`)
                .setColor(interaction.user && interaction.user.accentColor ? interaction.user.accentColor : 0x2b2d31)
                .setTimestamp()

              for (let idx = 0; idx < playerHands.length; idx++) {
                const h = playerHands[idx]
                const out = outcomesTmp[idx]
                finalEmbed.addFields({ name: `${await safe('minigames.your_hand','Your Hand')} ${playerHands.length>1?`#${idx+1}`:''} — ${out}`, value: `${displayHand(h)}`, inline: false })
              }

              finalEmbed.addFields({ name: await safe('minigames.dealer_shown','Dealer'), value: `${displayHand(dealer)}`, inline: false })

              try {
                await i.update({ embeds: [finalEmbed], components: [] })
              } catch (e) {}
            } catch (e) {}
            collector.stop('stand')
            return
          }
        }
  if (id === 'pdm-bj-double') {
       
          playerHands[activeHandIndex].push(deck.pop())
       
          doubledFlags[activeHandIndex] = true
        
          try {
            finalizeDealer()
            const outcomesTmp = []
            const naturalsTmp = []
            const dealerNaturalTmp = (dealer && dealer.length === 2 && handValue(dealer) === 21)
            for (const hand of playerHands) {
              const pval = handValue(hand)
              const dval = handValue(dealer)
              const isNatural = (hand.length === 2 && pval === 21)
              naturalsTmp.push(isNatural)
              if (pval > 21) outcomesTmp.push('LOSE')
              else if (dealerNaturalTmp && isNatural) outcomesTmp.push('PUSH')
              else if (isNatural && !dealerNaturalTmp) outcomesTmp.push('WIN')
              else if (dval > 21) outcomesTmp.push('WIN')
              else if (pval > dval) outcomesTmp.push('WIN')
              else if (pval < dval) outcomesTmp.push('LOSE')
              else outcomesTmp.push('PUSH')
            }
            const safe = async (k, def) => {
              try { if (!t) return def; const v = await t(k); return typeof v === 'string' && v.length ? v : def } catch (e) { return def }
            }
            const title = await safe('minigames.blackjack_label', 'Blackjack')
            const finalEmbed = new EmbedBuilder()
              .setTitle(`🎲 ${title} — ${(outcomesTmp.includes('WIN') ? await safe('minigames.result_win','You won') : outcomesTmp.every(o=>o==='PUSH') ? await safe('minigames.result_cancel','Push') : await safe('minigames.result_loss','You lost'))}`)
              .setColor(interaction.user && interaction.user.accentColor ? interaction.user.accentColor : 0x2b2d31)
              .setTimestamp()
            for (let idx = 0; idx < playerHands.length; idx++) {
              const h = playerHands[idx]
              const out = outcomesTmp[idx]
              finalEmbed.addFields({ name: `${await safe('minigames.your_hand','Your Hand')} ${playerHands.length>1?`#${idx+1}`:''} — ${out}`, value: `${displayHand(h)}`, inline: false })
            }
            finalEmbed.addFields({ name: await safe('minigames.dealer_shown','Dealer'), value: `${displayHand(dealer)}`, inline: false })
            try { await i.update({ embeds: [finalEmbed], components: [] }) } catch (e) {}
          } catch (e) {}
          collector.stop('double')
          return
        }
  if (id === 'pdm-bj-split') {
          const hand = playerHands[activeHandIndex]
          if (hand.length === 2 && hand[0].rank === hand[1].rank) {
   
            const cardA = hand[0]
            const cardB = hand[1]
            playerHands[activeHandIndex] = [cardA, deck.pop()]
            playerHands.splice(activeHandIndex+1, 0, [cardB, deck.pop()])
       
            doubledFlags.splice(activeHandIndex+1, 0, false)
            await i.update({ embeds: [await embedFor(activeHandIndex)], components: [await buttonsRow(false, activeHandIndex)] })
            return
          } else {
              await i.reply({ content: await safe('minigames.split_not_allowed', 'Cannot split'), flags: MessageFlags.Ephemeral })
            return
          }
        }
        if (id === 'pdm-bj-cancel') {
          await i.update({ embeds: [new EmbedBuilder().setDescription('Cancelled')], components: [] })
          collector.stop('cancel')
          return
        }
      } catch (err) {
        collector.stop('error')
        return
      }
    })

    collector.on('end', async (collected, reason) => {
      try {
        if (reason === 'cancel') return resolve({ result: 'CANCEL' })
        
        finalizeDealer()
        const outcomes = []
        const naturals = []
        const dealerNatural = (dealer && dealer.length === 2 && handValue(dealer) === 21)
        for (const hand of playerHands) {
          const pval = handValue(hand)
          const dval = handValue(dealer)
          const isNatural = (hand.length === 2 && pval === 21)
          naturals.push(isNatural)
          if (pval > 21) outcomes.push('LOSE')
          else if (dealerNatural && isNatural) outcomes.push('PUSH')
          else if (isNatural && !dealerNatural) outcomes.push('WIN')
          else if (dval > 21) outcomes.push('WIN')
          else if (pval > dval) outcomes.push('WIN')
          else if (pval < dval) outcomes.push('LOSE')
          else outcomes.push('PUSH')
        }

  
        try {
          const safe = async (k, def) => {
            try {
              if (!t) return def
              const v = await t(k)
              return typeof v === 'string' && v.length ? v : def
            } catch (e) {
              return def
            }
          }
          const title = await safe('minigames.blackjack_label', 'Blackjack')
          const finalEmbed = new EmbedBuilder()
            .setTitle(`🎲 ${title} — ${(outcomes.includes('WIN') ? await safe('minigames.result_win','You won') : outcomes.every(o=>o==='PUSH') ? await safe('minigames.result_cancel','Push') : await safe('minigames.result_loss','You lost'))}`)
            .setColor(interaction.user && interaction.user.accentColor ? interaction.user.accentColor : 0x2b2d31)
            .setTimestamp()

          for (let idx = 0; idx < playerHands.length; idx++) {
            const h = playerHands[idx]
            const out = outcomes[idx]
            finalEmbed.addFields({ name: `${await safe('minigames.your_hand','Your Hand')} ${playerHands.length>1?`#${idx+1}`:''} — ${out}`, value: `${displayHand(h)}`, inline: false })
          }

          finalEmbed.addFields({ name: await safe('minigames.dealer_shown','Dealer'), value: `${displayHand(dealer)}`, inline: false })

          try { await initial.edit({ embeds: [finalEmbed], components: [] }) } catch (e) {}
        } catch (e) {}

        const multipliers = doubledFlags.map(f => f ? 2 : 1)
        if (outcomes.includes('WIN')) return resolve({ result: 'WIN', outcomes, dealer: handToString(dealer), multipliers, naturals, dealerNatural })
        if (outcomes.every(o => o === 'PUSH')) return resolve({ result: 'PUSH', outcomes, dealer: handToString(dealer), multipliers, naturals, dealerNatural })
        return resolve({ result: 'LOSE', outcomes, dealer: handToString(dealer), multipliers, naturals, dealerNatural })
      } catch (err) {
        return reject(err)
      }
    })
  })
}

module.exports = { playGame, handValue, handToString }
